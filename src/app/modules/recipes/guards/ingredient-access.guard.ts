import { Inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

import { AuthService } from '../../authentication/services/auth.service';
import { RecipeService } from '../services/recipe.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IRecipe } from '../models/recipes';
import { IngredientService } from '../services/ingredient.service';
import { IIngredient } from '../models/ingredients';

@Injectable({
  providedIn: 'root',
})
export class IngredientAccessGuard implements CanActivate {
  constructor(
    private router: Router,
    @Inject(AuthService) private auth: AuthService,
    @Inject(IngredientService) private ingredientService: IngredientService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const recipeId = route.params?.['id'];

    let user: IUser = { ...nullUser };
    this.auth.currentUser$.subscribe((data) => (user = data));
    let ingredients: IIngredient[] = [];

    ingredients = this.ingredientService.ingredientSubject.getValue();
    const ingredient: IIngredient | undefined = ingredients.find(
      (ingredient) => ingredient.id == recipeId,
    );

    if (ingredient) {
      if (this.auth.checkIngredientValidity(ingredient, user)) {
        return true;
      } else {
        this.router.navigate(['/ingredients']);
        return false;
      }
    } else {
      this.router.navigate(['/ingredients']);
      return false;
    }
  }
}
