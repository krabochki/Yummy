import { Inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

import { AuthService } from '../../authentication/services/auth.service';
import { RecipeService } from '../services/recipe.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IRecipe } from '../models/recipes';

@Injectable({
  providedIn: 'root',
})
export class RecipeAccessGuard implements CanActivate {
  constructor(
    private router: Router,
    @Inject(AuthService) private auth: AuthService,
    @Inject(RecipeService) private recipeService: RecipeService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const recipeId = route.params?.['id'];

    let user: IUser = { ...nullUser };
    this.auth.currentUser$.subscribe((data) => (user = data));
    let recipes: IRecipe[] = [];

    recipes = this.recipeService.recipesSubject.getValue();
    const recipe: IRecipe | undefined = recipes.find(
      (recipe) => recipe.id == recipeId,
    );
    if (recipe)
      if (this.auth.checkValidity(recipe, user)) {
        return true;
      } else {
        this.router.navigate(['/recipes']);
        return false;
      }
    else {
      this.router.navigate(['/recipes']);
      return false;
    }
  }
}
