import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
} from '../../../models/ingredients';
import { Subject, find, takeUntil } from 'rxjs';
import { IRecipe } from '../../../models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IngredientService } from '../../../services/ingredient.service';

@Component({
  selector: 'app-ingredient-list-item',
  templateUrl: './ingredient-list-item.component.html',
  styleUrls: ['./ingredient-list-item.component.scss'],
})
export class IngredientListItemComponent implements OnInit, OnDestroy {
  @Input() ingredient: any = null;

  protected destroyed$: Subject<void> = new Subject<void>();
  private currentUser: IUser = nullUser;
  private ingredients: IIngredient[] = [];
  @Input() context: 'ingredient' | 'group' = 'ingredient';

  recipesNumber = 0;
  constructor(
    private recipeService: RecipeService,
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
    if (this.ingredient.ingredients) {
      return '/ingredients/groups/' + this.ingredient.id;
    } else return '/ingredients/list/' + this.ingredient.id;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
