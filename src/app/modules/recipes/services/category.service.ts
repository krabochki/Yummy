import { Injectable } from '@angular/core';
import { ICategory, ISection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  urlCategories: string = 'http://localhost:3000/categories';

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
    const findedCategories = categories.filter((cat) => {
      section.categoriesId.includes(cat.id);
    });
    if (findedCategories) return findedCategories;
    else return [];
  }

  updateCategory(category: ICategory) {
    return this.http.put<ICategory>(
      `${this.urlCategories}/${category.id}`,
      category,
    );
  }
}
