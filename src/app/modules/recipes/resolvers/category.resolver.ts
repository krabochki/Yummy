import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, catchError, EMPTY, map } from 'rxjs';
import { CategoryService } from '../services/category.service';
import { ICategory } from '../models/categories';

@Injectable({ providedIn: 'root' })
export class CategoryResolver {
  constructor(
    private categoryService: CategoryService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ICategory> {
    const categoryId = Number(route.params['id']);

    if (categoryId <= 0) {
      this.router.navigate(['/categories']);
      return EMPTY;
    }

    return this.categoryService.getCategory(categoryId).pipe(
      map((response: any) => {
        const category: ICategory = response[0];
        if (category) {
          return category;
        } else {
          throw new Error('Категория не найдена');
        }
      }),
      catchError(() => {
        this.router.navigate(['/categories']);
        return EMPTY;
      }),
    );
  }
}
