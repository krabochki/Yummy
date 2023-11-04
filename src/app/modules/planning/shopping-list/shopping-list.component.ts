import { Component, OnDestroy, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PlanService } from '../services/plan-service';
import { IPlan, nullPlan } from '../models/plan';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShoppingListItem, nullProduct } from '../models/shopping-list';
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

  protected form: FormGroup;

  protected newProductCreatingMode: boolean = false;

  protected actualShoppingList: ShoppingListItem[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private planService: PlanService,
    private authService: AuthService,
    private fb: FormBuilder,
    private title: Title,
  ) {
    this.title.setTitle('Список покупок');

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
      isNecessary: [false, [Validators.required]],
    });
  }

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

  private initCurrentUserPlan(): void {
    this.planService.plans$.subscribe((data: IPlan[]) => {
      this.currentUserPlan = this.planService.getPlanByUser(
        this.currentUser.id,
        data,
      );
      this.actualShoppingList = this.currentUserPlan.shoppingList;
    });
    this.shoppingList = this.sortByBought(this.actualShoppingList);
  }

  protected addShoppingListItem(): void {
    const maxId = Math.max(...this.shoppingList.map((g) => g.id));
    const newProduct: ShoppingListItem = {
      ...nullProduct,
      name: this.form.value.name,
      howMuch: this.form.value.howMuch,
      id: maxId + 1,
    };
    this.shoppingList.unshift(newProduct);
    this.planService.updatePlan(this.currentUserPlan).subscribe();
    this.resetFormProduct();
  }

  protected resetFormProduct() {
    this.form.get('name')?.setValue('');
    this.form.get('howMuch')?.setValue('');
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private sortByBought(shoppingList: ShoppingListItem[]): ShoppingListItem[] {
    return shoppingList.sort((a, b) => {
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
      this.shoppingList = this.shoppingList.filter((g) => g.id !== productId);
      this.planService.updatePlan(this.currentUserPlan).subscribe();
    }
  }

  protected removeAllProducts() {
    this.currentUserPlan.shoppingList = [];
    this.shoppingList = [];
    this.planService.updatePlan(this.currentUserPlan).subscribe();
  }

  protected drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.shoppingList, event.previousIndex, event.currentIndex);
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
