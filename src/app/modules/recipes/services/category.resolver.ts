import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, catchError, EMPTY, map } from 'rxjs';
import { CategoryService } from './category.service';
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
      this.router.navigate(['/sections']);
      return EMPTY;
    }

    return this.categoryService.categories$.pipe(
      map((categories: ICategory[]) => {
        const foundCategory = categories.find((category) => {
          if (category.id === categoryId && (category.status==='public')) return true;
          else return false;
        });
        if (foundCategory) {
          return foundCategory;
        } else {
          throw new Error('Категория не найдена');
        }
      }),
      catchError(() => {
        this.router.navigate(['/sections']);
        return EMPTY;
      }),
    );
  }
  }


   

