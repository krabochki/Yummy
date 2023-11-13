import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IIngredient, nullIngredient } from '../../../models/ingredients';
import { Subject, takeUntil } from 'rxjs';
import { IRecipe } from '../../../models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';

@Component({
  selector: 'app-ingredient-list-item',
  templateUrl: './ingredient-list-item.component.html',
  styleUrls: ['./ingredient-list-item.component.scss'],
})
export class IngredientListItemComponent implements OnInit, OnDestroy{
  @Input() ingredient: IIngredient = nullIngredient;

  protected destroyed$: Subject<void> = new Subject<void>();
  private recipes: IRecipe[] = [];
  private currentUser: IUser = nullUser;

  recipesNumber = 0;
  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
  ) {}
  ngOnInit() {
    this.authService.currentUser$.pipe(takeUntil(this.destroyed$)).subscribe(
      (receiverUser:IUser) => this.currentUser = receiverUser
    )
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.recipes = data;

        this.recipesNumber = this.recipeService.getRecipesByIngredient(
          this.recipeService.getPublicAndAllMyRecipes(data, this.currentUser.id),
          this.ingredient
        ).length;
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
