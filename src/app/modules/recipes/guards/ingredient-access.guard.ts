import { Inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IngredientService } from '../services/ingredient.service';
import { IIngredient } from '../models/ingredients';
import { switchMap, map, catchError, EMPTY } from 'rxjs';
import { IRecipe } from '../models/recipes';

@Injectable({
  providedIn: 'root',
})
export class IngredientAccessGuard implements CanActivate {
  constructor(
    private router: Router,
    @Inject(AuthService) private auth: AuthService,
    @Inject(IngredientService) private ingredientService: IngredientService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
     const id = route.params?.['id'];

     if (id <= 0) {
       this.router.navigate(['/ingredients']);
       return EMPTY;
     }
     return this.auth.getTokenUser().pipe(
       switchMap((user: IUser) => {
         return this.ingredientService.getIngredient(id).pipe(
           map((response:any) => {
             const ingredient:IIngredient = response[0];
             if (ingredient && this.auth.checkIngredientValidity(ingredient, user)) {
               return true;
             } else {
               this.router.navigate(['/ingredients']);
               return false;
             }
           }),
           catchError(() => {
             this.router.navigate(['/ingredients']);
             return EMPTY;
           }),
         );
       }),
     );
  }
}
