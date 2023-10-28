import { Injectable } from '@angular/core';
import { ICategory, ISection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
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

  getCategory(id: number) {
    return this.http.get<ICategory>(`${this.urlCategories}/${id}`);
  }



  deleteCategory(id: number) {
    return this.http.delete<ICategory>(`${this.urlCategories}/${id}`);
  }

  postCategory(category: ICategory) {
    return this.http.post<ICategory>(this.urlCategories, category);
  }

  getCategoriesBySection(
    section: ISection,
    categories: ICategory[],
  ): ICategory[] {

    const findedCategories: ICategory[] = [];
     categories.forEach((category) => {
       if (section.categoriesId.includes(category.id)) {
         findedCategories.push(category);
       }
     });
  
    return findedCategories;
  }
  
  sortCategoriesByName(categories: ICategory[]): ICategory[]{
     return categories.sort((category1: ICategory, category2: ICategory) =>
       category1.name > category2.name ? 1 : -1,
     );
  }

  getPopularCategories(categories:ICategory[], recipes:IRecipe[]) {
  // Создаем объект, в котором ключами будут ID категорий, а значениями количество рецептов в каждой категории
  const categoryCounts:CategoryCounts = {};
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
    return this.http.put<ICategory>(
      `${this.urlCategories}/${category.id}`,
      category,
    );
  }
}
