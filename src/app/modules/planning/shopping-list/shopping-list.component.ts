import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PlanService } from '../services/plan-service';
import { IPlan, nullPlan } from '../models/plan';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ProductType,
  ShoppingListItem,
  nullProduct,
  productTypes,
  typeGroup,
} from '../models/shopping-list';
import { Subject, takeUntil } from 'rxjs';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { baseComparator, dragStart } from 'src/tools/common';
import { IngredientService } from '../../recipes/services/ingredient.service';
import { IIngredient } from '../../recipes/models/ingredients';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class ShoppingListComponent implements OnInit, OnDestroy {
  protected shoppingList: ShoppingListItem[] = [];

  protected baseSvgPath: string = '../../../../../assets/images/svg/grocery/';

  private currentUser: IUser = { ...nullUser };
  private currentUserPlan: IPlan = nullPlan;

  protected productTypes = productTypes;

  protected form: FormGroup;

  protected deletingAllProductsModalShow = false;
  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocompleteTypes: ProductType[] = [];
  protected focused: boolean = false;
  protected selectedType: ProductType = productTypes[0];

  ingredients: IIngredient[] = [];
  protected newProductCreatingMode: boolean = false;
  protected note: string = '';

  protected actualShoppingList: ShoppingListItem[] = [];
  protected groupedProducts: { [key: string]: ShoppingListItem[] } = {};

  protected destroyed$: Subject<void> = new Subject<void>();

  protected data: any[] = [];
  bodyElement: HTMLElement = document.body;

  //изменение курсора когда зажат элемент
  dragStart() {
    dragStart();
  }

  trackByItems(index: number, item: any): number {
    return item.id;
  }

  constructor(
    private cd: ChangeDetectorRef,
    private planService: PlanService,
    private authService: AuthService,
    private fb: FormBuilder,
    private title: Title,
    private ingredientService: IngredientService,
  ) {
    this.title.setTitle('Список покупок');
    this.productTypes.sort((t1, t2) => {
      return baseComparator(t1.name, t2.name);
    });

    this.form = this.initNewShoppingListItemForm();
  }

  async drop(events: CdkDragDrop<string[]>) {
    this.bodyElement.classList.remove('inheritCursors');
    this.bodyElement.style.cursor = 'unset';

    if (events.previousContainer === events.container) {
      moveItemInArray(
        events.container.data,
        events.previousIndex,
        events.currentIndex,
      );
    } else {
      transferArrayItem(
        events.previousContainer.data,
        events.container.data,
        events.previousIndex,
        events.currentIndex,
      );
      const droppedProduct: ShoppingListItem = JSON.parse(
        JSON.stringify(events.container.data[events.currentIndex]),
      );
      const currentType: typeGroup = this.data.find(
        (g) => g.items === events.container.data,
      );
      if (currentType.type.id !== droppedProduct.type) {
        const findedProduct = this.currentUserPlan.shoppingList.find(
          (i) => i.id === droppedProduct.id,
        );
        if (findedProduct) findedProduct.type = currentType.type.id;
          this.loading = true;
          this.cd.markForCheck();
        await this.planService.updatePlanInSupabase(this.currentUserPlan)
          this.loading = false;
          this.cd.markForCheck();
      }
    }
  }

  private initNewShoppingListItemForm(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      howMuch: ['', Validators.maxLength(17)],
      note: ['', Validators.maxLength(100)],
    });
  }

  public ngOnInit(): void {
    this.initCurrentUser();
    this.initCurrentUserPlan();
    this.initIngredients();
  }

  private initCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
      });
  }

  initIngredients() {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((ingredients) => (this.ingredients = ingredients));
  }

  findType(name: string) {
    return this.productTypes.find((t) => t.name === name);
  }

  findIngredientByName(name: string) {
    return this.ingredientService.findIngredientByName(name, this.ingredients);
  }

  realLink(item: ShoppingListItem) {
    return item.relatedRecipe || this.findIngredientByName(item.name).id !== 0;
  }
  getLink(item: ShoppingListItem) {
    //связанный рецепт приоритетнее чем найденный ингредиент
    if (item.relatedRecipe) return '/recipes/list/' + item.relatedRecipe;
    if (this.findIngredientByName(item.name).id !== 0)
      return '/ingredients/list/' + this.findIngredientByName(item.name).id;
    return null;
  }

  private initCurrentUserPlan(): void {
    this.planService.plans$.subscribe((data: IPlan[]) => {
      this.currentUserPlan = this.planService.getPlanByUser(
        this.currentUser.id,
        data,
      );
      this.actualShoppingList = [...this.currentUserPlan.shoppingList];
      if (this.actualShoppingList.length !== this.shoppingList.length) {
        this.groupedProducts = this.divideShoppingListByTypes(
          this.sortByBought(this.actualShoppingList),
        );

        const shoppingList: ShoppingListItem[] = this.actualShoppingList;
        const productTypes: ProductType[] = this.productTypes;
        let itemsByCategory: typeGroup[] = [];
        productTypes.forEach((type) => {
          itemsByCategory.push({ type: type, items: [] });
        });
        shoppingList.forEach((item) => {
          const findedTypeGroup = itemsByCategory.find(
            (i) => i.type.id === item.type,
          );
          if (findedTypeGroup) findedTypeGroup.items.push(item);
        });
        itemsByCategory = itemsByCategory.filter((i) => i.items.length !== 0);
        this.data = itemsByCategory;

        this.shoppingList = [...this.sortByBought(this.actualShoppingList)];
      }
      //если добавили или удалили что-то то обновляю список, если просто отметили купленным то нет(чтобы анимация работала)
    });
  }

  private divideShoppingListByTypes(list: ShoppingListItem[]): {
    [key: string]: ShoppingListItem[];
  } {
    const groupedProducts: { [key: string]: ShoppingListItem[] } = {};
    list.forEach((product) => {
      const productType = productTypes.find((type) => type.id === product.type);
      if (productType) {
        const typeName = productType.name;
        if (!groupedProducts[typeName]) {
          groupedProducts[typeName] = [];
        }
        groupedProducts[typeName].push(product);
      }
    });
    return groupedProducts;
  }

  async addShoppingListItem() {
    if (this.form.valid) {
      let maxId = 0;
      if (this.shoppingList.length > 0)
        maxId = Math.max(...this.shoppingList.map((g) => g.id));
      const newProduct: ShoppingListItem = {
        ...nullProduct,
        name: this.form.value.name,
        howMuch: this.form.value.howMuch,
        id: maxId + 1,
        type: this.selectedType.id,
        note: this.form.value.note,
      };
      this.currentUserPlan.shoppingList.unshift(newProduct);
      this.loading = true;
      this.cd.markForCheck();
      await this.planService.updatePlanInSupabase(this.currentUserPlan);
      this.resetFormProduct();
      this.loading = false;
      this.cd.markForCheck();
    }
  }

  protected resetFormProduct() {
    this.form.get('name')?.setValue('');
    this.selectedType = this.productTypes[0];
    this.searchQuery = '';
    this.form.get('howMuch')?.setValue('');
    this.form.get('note')?.setValue('');
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.form.reset();
  }

  private sortByBought(shoppingList: ShoppingListItem[]): ShoppingListItem[] {
    const filter = shoppingList.sort((a, b) => {
      return baseComparator(b.name, a.name);
    });
    return filter.sort((a, b) => {
      return baseComparator(a.isBought, b.isBought);
    });
  }

  async markProductAsBought(productId: number) {
    const findedProductIndex = this.shoppingList.findIndex(
      (g) => g.id === productId,
    );
    if (findedProductIndex !== -1) {
      const purchasedProduct = this.shoppingList[findedProductIndex];
      purchasedProduct.isBought = !purchasedProduct.isBought;
      this.loading = true;
      this.cd.markForCheck();
      await this.planService.updatePlanInSupabase(this.currentUserPlan);
      this.loading = false;
      this.cd.markForCheck();
    }
  }
  async removeProduct(productId: number) {
    const findedProduct = this.shoppingList.find((g) => g.id === productId);

    if (findedProduct) {
      this.currentUserPlan.shoppingList =
        this.currentUserPlan.shoppingList.filter((g) => g.id !== productId);

      this.loading = true;
      this.cd.markForCheck();
      await this.planService.updatePlanInSupabase(this.currentUserPlan);
      this.loading = false;
      this.cd.markForCheck();
    }
  }

  loading = false;
  async removeAllProducts() {
    this.loading = true;
    this.cd.markForCheck();
    this.currentUserPlan.shoppingList = [];
    this.shoppingList = [];
      this.loading = true;
      this.cd.markForCheck();
    await this.planService.updatePlanInSupabase(this.currentUserPlan);
      this.loading = false;
      this.cd.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  //поиск рецептов
  protected blur(): void {
    if (this.searchQuery !== '' && this.searchQuery !== this.selectedType.name)
      this.searchQuery = '';

    this.autocompleteShow = false;
    this.focused = false;
  }

  protected focus(): void {
    this.autocompleteShow = true;
    this.recipeSearching();
  }
  protected chooseRecipe(type: ProductType): void {
    this.searchQuery = type.name;
    this.selectedType = type;
  }
  protected recipeSearching(): void {
    this.autocompleteShow = true;
    this.focused = true;
    if (this.searchQuery) {
      this.autocompleteTypes = [];
      if (this.selectedType.name !== this.searchQuery) {
        const without = this.productTypes.find(
          (p) => p.name === 'Без категории',
        );
        if (without) this.selectedType = without;
      }
      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      const filterTypes: ProductType[] = this.productTypes.filter(
        (type: ProductType) =>
          type.name.toLowerCase().replace(/\s/g, '').includes(search),
      );

      filterTypes.forEach((element) => {
        this.autocompleteTypes.push(element);
      });
    } else this.autocompleteTypes = [...this.productTypes];
  }

  handleDeletingAllProductsModal(answer: boolean) {
    if (answer) this.removeAllProducts();
    this.deletingAllProductsModalShow = false;
  }
}
