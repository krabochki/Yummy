import { Injectable } from '@angular/core';
import { ICategory, ISection, nullCategory } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { categoriesUrl } from 'src/tools/source';
import { IRecipe } from '../models/recipes';

interface CategoryCounts {
  [categoryId: number]: number;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  urlCategories: string = categoriesUrl;

  private categoriesSubject = new BehaviorSubject<ICategory[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  loadCategoryData() {
    this.getCategories().subscribe((data) => {
      this.categoriesSubject.next(data);
    });
  }

  getCategories() {
    return this.http.get<ICategory[]>(this.urlCategories);
  }


  getRelatedCategories(recipes: IRecipe[],categories:ICategory[]): ICategory[] {
     const uniqueCategories: { [id: string]: boolean } = {};
     recipes.forEach((recipe) => {
       recipe.categories.forEach((categoryId) => {
         uniqueCategories[categoryId] = true;
       });
     });

     const uniqueCategoriesArray: ICategory[] = categories.filter(
       (category) => uniqueCategories[category.id],
     );

     return uniqueCategoriesArray;
  }

  deleteCategory(id: number) {
    return this.http.delete<ICategory>(`${this.urlCategories}/${id}`).pipe(
      tap(() =>
        this.categoriesSubject.next(
          this.categoriesSubject.value.filter((category) => category.id !== id),
        ),
      ),
      catchError((error) => {
        return throwError(error);
      }),
    );
  }

  postCategory(category: ICategory) {
    return this.http.post<ICategory>(this.urlCategories, category).pipe(
      tap((newRecipe: ICategory) => {
        const currentCategories = this.categoriesSubject.value;
        const updatedCategories = [...currentCategories, newRecipe];
        this.categoriesSubject.next(updatedCategories);
      }),
    );
  }

  getCategoriesBySection(
    section: ISection,
    categories: ICategory[],
  ): ICategory[] {
    const findedCategories: ICategory[] = [];
    categories.forEach((category) => {
      if (section.categories.includes(category.id)) {
        findedCategories.push(category);
      }
    });

    return findedCategories;
  }

  sortCategoriesByName(categories: ICategory[]): ICategory[] {
    return categories.sort((category1: ICategory, category2: ICategory) =>
      category1.name > category2.name ? 1 : -1,
    );
  }

  getPopularCategories(categories: ICategory[], recipes: IRecipe[]) {
    // Создаем объект, в котором ключами будут ID категорий, а значениями количество рецептов в каждой категории
    const categoryCounts: CategoryCounts = {};
    // Перебираем рецепты и увеличиваем счетчик в соответствующей категории
    for (const recipe of recipes) {
      for (const categoryId of recipe.categories) {
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      }
    }
    // Сортируем категории по количеству рецептов в убывающем порядке
    const sortedCategories = categories.slice().sort((a, b) => {
      const countA = categoryCounts[a.id] || 0;
      const countB = categoryCounts[b.id] || 0;
      return countB - countA;
    });

    return sortedCategories;
  }

  updateCategory(category: ICategory) {
    return this.http
      .put<ICategory>(`${this.urlCategories}/${category.id}`, category)
      .pipe(
        tap((updatedCategory: ICategory) => {
          const currentCategories = this.categoriesSubject.value;
          const index = currentCategories.findIndex(
            (r) => r.id === updatedCategory.id,
          );
          if (index !== -1) {
            const updatedCategories = [...currentCategories];
            updatedCategories[index] = updatedCategory;

            this.categoriesSubject.next(updatedCategories);
          }
        }),
      );
  }
}
