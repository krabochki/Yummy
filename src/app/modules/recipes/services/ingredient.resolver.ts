import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, catchError, EMPTY, map } from 'rxjs';
import { ICategory } from '../models/categories';
import { IngredientService } from './ingredient.service';
import { IIngredient } from '../models/ingredients';

@Injectable({ providedIn: 'root' })
export class IngredientResolver {
  constructor(
    private ingredientService: IngredientService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IIngredient> {
    const ingredientId = Number(route.params['id']);

    if (ingredientId <= 0) {
      this.router.navigate(['/ingredients']);
      return EMPTY;
    }

    return this.ingredientService.ingredients$.pipe(
      map((ingredients: IIngredient[]) => {
        const foundIngredient = ingredients.find((ingredient) => {
          if (ingredient.id === ingredientId)
            return true;
          else return false;
        });
        if (foundIngredient) {
          return foundIngredient;
        } else {
          throw new Error('Ингредиент не найден');
        }
      }),
      catchError(() => {
        this.router.navigate(['/ingredients']);
        return EMPTY;
      }),
    );
  }
}


   

