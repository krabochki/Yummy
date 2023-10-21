import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, catchError, EMPTY } from 'rxjs';
import { CategoryService } from './category.service';
import { ICategory } from '../models/categories';

@Injectable({ providedIn: 'root' })
export class CategoryResolver {
  constructor(
    private categoryService: CategoryService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ICategory> {
    if (route.params?.['id'] === '0') {
      return EMPTY;
    }
    return this.categoryService.getCategory(route.params?.['id']).pipe(
      catchError(() => {
        this.router.navigate(['categories']);
        return EMPTY;
      }),
    );
  }
}
