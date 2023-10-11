import {
  Router,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, of, catchError, EMPTY } from 'rxjs';
import { IRecipe } from '../models/recipes';
import { RecipeService } from './recipe.service';

@Injectable({ providedIn: 'root' })
export class RecipeResolver {
  constructor(
    private recipeService: RecipeService,
    private router: Router,
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<IRecipe> {
    return this.recipeService.getRecipe(route.params?.['id']).pipe(
      catchError(() => {
        this.router.navigate(['recipes']);
        return EMPTY;
      }),
    );
  }
}
