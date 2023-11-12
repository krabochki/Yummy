import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { IngredientService } from './ingredient.service';
import { IIngredientsGroup } from '../models/ingredients';

@Injectable({ providedIn: 'root' })
export class IngredientGroupResolver implements Resolve<IIngredientsGroup> {
  constructor(
    private ingredientService: IngredientService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IIngredientsGroup> {
    const groupId = Number(route.params['id']);

    if (groupId <= 0) {
      this.router.navigate(['/ingredients']);
      return EMPTY;
    }

    return this.ingredientService.ingredientsGroups$.pipe(
      switchMap((groups: IIngredientsGroup[]) => {
        const foundGroup: IIngredientsGroup | undefined = groups.find(
          (group) => group.id === groupId,
        );
        if (foundGroup) {
          return of(foundGroup);
        } else {
          this.router.navigate(['/ingredients']);
          throw new Error('Секция не найдена');
        }
      }),
      catchError(() => {
        this.router.navigate(['/ingredients']);
        return EMPTY;
      }),
    );
  }
}