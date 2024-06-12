import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, catchError, EMPTY, map } from 'rxjs';
import { IngredientService } from '../services/ingredient.service';
import { IIngredient } from '../models/ingredients';

@Injectable({ providedIn: 'root' })
export class IngredientResolver {
  constructor(
    private ingredientService: IngredientService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IIngredient> {
    const id = Number(route.params['id']);

    if (id <= 0) {
      this.router.navigate(['/ingredients']);
      return EMPTY;
    }

    return this.ingredientService.getIngredient(id).pipe(
      map((response: any) => {
        const ingredient: IIngredient = response[0];
        if (ingredient) {
          return ingredient;
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
