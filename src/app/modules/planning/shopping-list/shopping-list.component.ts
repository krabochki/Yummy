import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PlanService } from '../services/plan.service';
import { AuthService } from '../../authentication/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ProductType,
  ShoppingListItem,
  nullProduct,
  productTypes,
  typeGroup,
} from '../models/shopping-list';
import { Subject, finalize, forkJoin, tap } from 'rxjs';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { baseComparator, dragStart } from 'src/tools/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class ShoppingListComponent implements OnInit, OnDestroy {
printRecipe() {
  window.print();
}
  initalLoading = false;
  shoppingList: ShoppingListItem[] = [];
   relatedIngredients: { ingredientId: number; productId: number }[] =
    [];
  productTypes = productTypes;

  deleteModal = false;
  loadingModal = false;
  createMode: boolean = false;

  searchQuery: string = '';
  autocompleteShow: boolean = false;
  autocompleteTypes: ProductType[] = [];
  focused: boolean = false;

  selectedType: ProductType = productTypes[0];
  note: string = '';

  actualShoppingList: ShoppingListItem[] = [];
  groupedProducts: { [key: string]: ShoppingListItem[] } = {};

  destroyed$: Subject<void> = new Subject<void>();

  data: any[] = [];
  bodyElement: HTMLElement = document.body;
  baseSvgPath: string = '/assets/images/svg/grocery/';
  form: FormGroup;

  constructor(
    private cd: ChangeDetectorRef,
    private planService: PlanService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private title: Title,
  ) {
    this.title.setTitle('Список покупок');
    this.productTypes.sort((t1, t2) => {
      return baseComparator(t1.name, t2.name);
    });

    this.form = this.initNewShoppingListItemForm();
  }

  //изменение курсора когда зажат элемент
  dragStart() {
    dragStart();
  }

  trackByItems(index: number, item: any): number {
    return item.id;
  }

  private getRelatedIngredients() {
    return this.planService
      .getRelatedIngredientsForProducts()
      .pipe(
        tap((relatedIngredients) => {
          this.relatedIngredients = relatedIngredients;
        }),
      );
  }

  drop(events: CdkDragDrop<string[]>) {
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
      if (currentType.type.id !== droppedProduct.typeId) {
        const findedProduct = this.actualShoppingList.find(
          (i) => i.id === droppedProduct.id,
        );
        if (findedProduct) {
          findedProduct.typeId = currentType.type.id;
          this.loadingModal = true;
          this.cd.markForCheck();

          this.planService
            .updateProductType(findedProduct.id, findedProduct.typeId)
            .pipe(
              tap(() => {
                this.getListInfo();
              }),
              finalize(() => {
                this.loadingModal = false;
                this.resetFormProduct();
              }),
            )
            .subscribe();
        }
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
    this.initalLoading = true;
    this.relatedIngredients = [];
    this.shoppingList = [];
    this.actualShoppingList = [];

        const plans$ = this.getProducts();
        const relatedIngredients$ = this.getRelatedIngredients();
        forkJoin([plans$, relatedIngredients$]).subscribe(() => {
          this.setRelatedIngredientsToProducts();
          this.initalLoading = false;

          this.cd.markForCheck();
        });
    
  }

  findType(name: string) {
    return this.productTypes.find((t) => t.name === name);
  }

  private findRelatedIngredientByProductId(id: number) {
    return (
      this.relatedIngredients.find((ri) => ri.productId === id) || {
        productId: 0,
        ingredientId: 0,
      }
    );
  }

  realLink(item: ShoppingListItem) {
    const recipeId = item.recipeId;
    const ingredientId = item.ingredientId;
    if (recipeId) return recipeId;
    if (ingredientId) return ingredientId;
    return 0;
  }

  getLink(item: ShoppingListItem) {
    // Связанный рецепт приоритетнее чем найденный ингредиент
    const recipeId = item.recipeId;
    const ingredientId = item.ingredientId;
    if (recipeId) return `/recipes/list/${recipeId}`;
    if (ingredientId) return `/ingredients/list/${ingredientId}`;
    return null;
  }

  getProducts() {
    return this.planService.getProductsByUserId().pipe(
      tap((receivedList) => {
        this.actualShoppingList = receivedList;
        this.getListInfo();
      }),
    );
  }

  setRelatedIngredientsToProducts() {
    this.actualShoppingList.forEach((product) => {
      if (this.findRelatedIngredientByProductId(product.id).ingredientId) {
        product.ingredientId = this.findRelatedIngredientByProductId(
          product.id,
        ).ingredientId;
      }
    });
    this.cd.markForCheck();
  }
  getListInfo() {
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
        (i) => i.type.id === item.typeId,
      );
      if (findedTypeGroup) findedTypeGroup.items.push(item);
    });
    itemsByCategory = itemsByCategory.filter((i) => i.items.length !== 0);
    this.data = itemsByCategory;

    this.shoppingList = [...this.sortByBought(this.actualShoppingList)];

    this.cd.markForCheck();
  }

  navigateToAddProduct() {
    const sectionTag = document.getElementById('add-product');
    if (sectionTag) {
      const headerHeight =
        document.getElementsByClassName('header')[0].clientHeight;
      window.scrollTo({
        top: sectionTag.offsetTop - headerHeight,
        behavior: 'smooth',
      });
    }
  }

  private divideShoppingListByTypes(list: ShoppingListItem[]): {
    [key: string]: ShoppingListItem[];
  } {
    const groupedProducts: { [key: string]: ShoppingListItem[] } = {};
    list.forEach((product) => {
      const productType = productTypes.find(
        (type) => type.id === product.typeId,
      );
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

  addShoppingListItem() {
    if (this.form.valid) {
      const newProduct: ShoppingListItem = {
        ...nullProduct,
        name: this.form.value.name,
        amount: this.form.value.howMuch,
        typeId: this.selectedType.id,
        note: this.form.value.note,
      };
      this.loadingModal = true;
      this.cd.markForCheck();
      this.planService
        .postProduct(newProduct)
        .pipe(
          tap((res: any) => {
            this.planService
              .getRelatedIngredientsForProduct(res.id)
              .pipe(
                tap((relatedIngredients) => {
                  if (relatedIngredients.length) {
                    this.relatedIngredients = [
                      ...this.relatedIngredients,
                      ...relatedIngredients,
                    ];
                  }
                  newProduct.id = res.id;
                  this.actualShoppingList.push(newProduct);
                   this.setRelatedIngredientsToProducts();

                  this.getListInfo();
                  this.cd.markForCheck();
                }),
                finalize(() => {
                  this.loadingModal = false;
                  this.resetFormProduct();
                  this.cd.markForCheck();
                }),
              )
              .subscribe();
          }),
        )
        .subscribe();
      this.cd.markForCheck();
    }
  }

  resetFormProduct() {
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
      return baseComparator(a.bought, b.bought);
    });
  }

  markProductAsBought(productId: number) {
    const findedProductIndex = this.shoppingList.findIndex(
      (g) => g.id === productId,
    );
    if (findedProductIndex !== -1) {
      const purchasedProduct = this.shoppingList[findedProductIndex];
      purchasedProduct.bought = purchasedProduct.bought === 1 ? 0 : 1;
      this.loadingModal = true;
      this.cd.markForCheck();
      this.planService
        .markProductAsBought(purchasedProduct)
        .pipe(
          tap(() => {
            const findedProduct = this.actualShoppingList.find(
              (product) => product.id === purchasedProduct.id,
            );
            if (findedProduct) {
              findedProduct.bought = purchasedProduct.bought;
              this.getListInfo();
            }
          }),
          finalize(() => {
            this.loadingModal = false;
            this.resetFormProduct();
          }),
        )
        .subscribe();
      this.cd.markForCheck();
    }
  }

  removeProduct(productId: number) {
    const findedProduct = this.shoppingList.find((g) => g.id === productId);
    this.loadingModal = true;
    this.cd.markForCheck();

    if (findedProduct) {
      this.actualShoppingList = this.actualShoppingList.filter(
        (g) => g.id !== productId,
      );

      this.planService
        .deleteProduct(findedProduct.id)
        .pipe(
          tap(() => {
            this.getListInfo();
          }),
          finalize(() => {
            this.loadingModal = false;
            this.resetFormProduct();
          }),
        )
        .subscribe();
    }
  }

  removeAllProducts() {
    this.loadingModal = true;
    this.cd.markForCheck();
    this.actualShoppingList = [];
    this.planService
      .deleteAllProductsForUser()
      .pipe(
        tap(() => {
          this.getListInfo();
        }),
        finalize(() => {
          this.loadingModal = false;
          this.resetFormProduct();
        }),
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  //поиск рецептов
  blur(): void {
    if (this.searchQuery !== '' && this.searchQuery !== this.selectedType.name)
      this.searchQuery = '';

    this.autocompleteShow = false;
    this.focused = false;
  }

  focus(): void {
    this.autocompleteShow = true;
    this.searchTypes();
  }
  chooseRecipe(type: ProductType): void {
    this.searchQuery = type.name;
    this.selectedType = type;
  }
  searchTypes(): void {
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
    this.deleteModal = false;
  }
}
