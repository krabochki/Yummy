import { Inject, Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../authentication/services/auth.service';
import { RecipeService } from '../services/recipe.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IRecipe, nullRecipe } from '../models/recipes';

@Injectable({
  providedIn: 'root',
})
export class RecipeAccessGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(RecipeService) private recipeService: RecipeService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    const recipeId = route.params?.['id'];

    let user: IUser = nullUser;
    this.auth.getCurrentUser().subscribe((data) => (user = data));
    let recipes: IRecipe[] = [];

    this.recipeService.recipes$.subscribe((data) => {
      recipes = data;
    });
    console.log(recipes)
    const recipe: IRecipe | undefined = recipes.find(
      (recipe) => recipe.id == recipeId,
    );

    console.log(recipe?.authorId)
    console.log(user.id);
    if (recipe)
      if (
        recipe.authorId === user.id ||
        user.role === 'moderator' ||
        user.role === 'admin' ||
        recipe.status === 'public'
      ) {
        
        console.log(true)
        return true;
      } else {
        return false;
      }
    else {

      return false;
    }
  }
}
