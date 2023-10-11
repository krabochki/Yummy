import { Injectable } from '@angular/core';
import { ICategory } from '../models/categories';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  url: string = 'http://localhost:3000/categories';

  constructor(private http: HttpClient) {}

  getCategories() {
    return this.http.get<ICategory[]>(this.url);
  }

  getCategory(id: number) {
    return this.http.get<ICategory>(`${this.url}/${id}`);
  }

  deleteCategory(id: number) {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  postCategory(recipe: ICategory) {
    return this.http.post<ICategory>(this.url, recipe);
  }

  updateCategory(recipe: ICategory) {
    return this.http.put<ICategory>(`${this.url}/${recipe.id}`, recipe);
  }
}
