import { Inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

import { AuthService } from '../../authentication/services/auth.service';
import { RecipeService } from '../services/recipe.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IRecipe } from '../models/recipes';
import { EMPTY, catchError, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeAccessGuard implements CanActivate {
  constructor(
    private router: Router,
    @Inject(AuthService) private auth: AuthService,
    @Inject(RecipeService) private recipeService: RecipeService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const recipeId = route.params?.['id'];        

    return this.auth.getTokenUser().pipe(
      switchMap((user: IUser) => {
        return this.recipeService.getShortRecipe(recipeId).pipe(
          map((recipe: IRecipe) => {
            if (recipe && this.auth.checkValidity(recipe, user)) {
              return true;
            } else {
              this.router.navigate(['/recipes']);
              return false;
            }
          }),
          catchError(() => {
            this.router.navigate(['/recipes']);
            return EMPTY;
          }),
        );
      }),
    );
  }
}
