import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, catchError, EMPTY, map } from 'rxjs';
import { IRecipe } from '../models/recipes';
import { RecipeService } from './recipe.service';

@Injectable({ providedIn: 'root' })
export class RecipeResolver {
  constructor(
    private recipeService: RecipeService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IRecipe> {
 
        const recipeId = Number(route.params['id']);

        if (recipeId <= 0) {
          this.router.navigate(['/recipes']);
          return EMPTY;
        }

        return this.recipeService.getShortRecipe(recipeId).pipe(
          map((recipe: IRecipe) => {
            if (recipe) {
              return recipe;
            } else {
              throw new Error('Рецепт не найден');
            }
          }),
          catchError(() => {
            this.router.navigate(['/recipes']);
            return EMPTY;
          }),
        );

  }
}
