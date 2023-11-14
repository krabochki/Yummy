import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
} from '../../../models/ingredients';
import { Observable, Subject, find, forkJoin, takeUntil } from 'rxjs';
import { IRecipe } from '../../../models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, PermissionContext, nullUser } from 'src/app/modules/user-pages/models/users';
import { IngredientService } from '../../../services/ingredient.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';

@Component({
  selector: 'app-ingredient-list-item',
  templateUrl: './ingredient-list-item.component.html',
  styleUrls: ['./ingredient-list-item.component.scss'],
  animations: [trigger('modal',modal())]
})
export class IngredientListItemComponent implements OnInit, OnDestroy {
  @Input() ingredient: any = null;
  @Input() context: 'ingredient' | 'group' = 'ingredient';

  currentUser: IUser = nullUser;
  deleteModalShow: boolean = false;
  successDeleteModalShow: boolean = false;
  private groups: IIngredientsGroup[] = [];
  private ingredients: IIngredient[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  get showDeletingButton() {
    const permissionName: PermissionContext =
      this.context === 'ingredient'
        ? 'show-ingredient-deleting'
        : 'show-ingredient-group-deleting';
    return this.userService.getPermission(permissionName, this.currentUser);
  }

  recipesNumber = 0;
  constructor(
    private recipeService: RecipeService,
    private userService: UserService,
    private authService: AuthService,
    private ingredientService: IngredientService,
  ) {}
  ngOnInit() {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedIngredients: IIngredient[]) =>
          (this.ingredients = receivedIngredients.filter(
            (i) => i.status === 'public',
          )),
    );
    this.ingredientService.ingredientsGroups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedGroups: IIngredientsGroup[]) =>
          this.groups = receivedGroups
      );
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receiverUser: IUser) => (this.currentUser = receiverUser));
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        const publicAndAllMyRecipes =
          this.recipeService.getPublicAndAllMyRecipes(
            data,
            this.currentUser.id,
          );
        if (this.context === 'ingredient') {
          this.recipesNumber = this.recipeService.getRecipesByIngredient(
            publicAndAllMyRecipes,
            this.ingredient,
          ).length;
        } else {
          const group: IIngredientsGroup = this.ingredient;
          this.recipesNumber = this.ingredientService.getRecipesNumberOfGroup(
            group,
            this.ingredients,
            publicAndAllMyRecipes,
          );
        }
      });
  }

  get link() {
    return this.ingredient.ingredients
      ? '/ingredients/groups/' + this.ingredient.id
      : '/ingredients/list/' + this.ingredient.id;
  }

  protected handleDeleteModal(answer: boolean) {
    if (answer) this.successDeleteModalShow = true;
    this.deleteModalShow = false;
  }

  protected handleSuccessDeleteModal() {
    this.successDeleteModalShow = false;
    setTimeout(() => {
      this.deleteIngredient();
    }, 300);
  }

  deleteIngredient() {

    if (this.context === 'group') {
      this.ingredientService.deleteGroup(this.ingredient.id).subscribe()
    }
    else {
      this.ingredientService.deleteIngredient(this.ingredient.id).subscribe(() => {
        const subscribes: Observable<IIngredientsGroup>[] = [];
        //перебираем группы ингредиента и убираем ингредиент из списка ингредиентов группы
        const groups: IIngredientsGroup[] = this.ingredientService.getGroupOfIngredient(this.groups, this.ingredient);
        groups.forEach((group) => {
          const updatedGroup = {
            ...{ ...group },
            ingredients: {...group}.ingredients.filter(i=>i!==this.ingredient.id)
          }
          subscribes.push(this.ingredientService.updateIngredientGroup(updatedGroup))
        });
        forkJoin(subscribes).subscribe();
      });
    }

  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
