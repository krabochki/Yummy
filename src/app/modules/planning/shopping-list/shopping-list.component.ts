import { Component, OnDestroy, OnInit } from '@angular/core';
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
} from '../models/shopping-list';
import { Subject, takeUntil } from 'rxjs';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
  animations: [trigger('height', heightAnim())],
})
export class ShoppingListComponent implements OnInit, OnDestroy {
  protected shoppingList: ShoppingListItem[] = [];

  protected baseSvgPath: string = '../../../../../assets/images/svg/grocery/';

  private currentUser: IUser = nullUser;
  private currentUserPlan: IPlan = nullPlan;

  protected productTypes = productTypes;

  protected form: FormGroup;

  protected newProductCreatingMode: boolean = false;

  protected actualShoppingList: ShoppingListItem[] = [];
  protected groupedProducts: { [key: string]: ShoppingListItem[] } = {};

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private planService: PlanService,
    private authService: AuthService,
    private fb: FormBuilder,
    private title: Title,
  ) {
    this.title.setTitle('Список покупок');
    this.productTypes.sort((t1, t2) => { if(t1.name > t2.name) return 1; else return -1})

    this.form = this.initNewShoppingListItemForm();
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

  note: string = '';
  public ngOnInit(): void {
    this.initCurrentUser();
    this.initCurrentUserPlan();
  }

  private initCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
      });
  }

  findType(name: string) {
    return this.productTypes.find((t) => t.name === name);
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

  protected addShoppingListItem(): void {
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
    this.planService.updatePlan(this.currentUserPlan).subscribe();
    this.resetFormProduct();
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
      if (a.id > b.id) return 1;
      else return -1;
    });
    return filter.sort((a, b) => {
      if (a.isBought && !b.isBought) {
        return 1;
      } else {
        return -1;
      }
    });
  }

  protected markProductAsBought(productId: number) {
    const findedProductIndex = this.shoppingList.findIndex(
      (g) => g.id === productId,
    );
    if (findedProductIndex !== -1) {
      const purchasedProduct = this.shoppingList[findedProductIndex];
      purchasedProduct.isBought = !purchasedProduct.isBought;

      
      this.planService.updatePlan(this.currentUserPlan).subscribe();
    }
  }
  protected removeProduct(productId: number) {
    const findedProduct = this.shoppingList.find((g) => g.id === productId);
    
    if (findedProduct) {



      this.currentUserPlan.shoppingList = this.currentUserPlan.shoppingList.filter((g) => g.id !== productId);;

      
      this.planService.updatePlan(this.currentUserPlan).subscribe();
    }
  }

  protected removeAllProducts() {
    this.currentUserPlan.shoppingList = [];
    this.shoppingList = [];
    this.planService.updatePlan(this.currentUserPlan).subscribe();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocompleteTypes: ProductType[] = [];

  protected focused: boolean = false;
  protected selectedType: ProductType = productTypes[0];
  //поиск рецептов
  protected blur(): void {
    if (
      this.searchQuery !== '' &&
      this.searchQuery !== this.selectedType.name 
    )
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
      if (this.selectedType.name !== this.searchQuery)
        this.selectedType = this.productTypes[0];

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
}
