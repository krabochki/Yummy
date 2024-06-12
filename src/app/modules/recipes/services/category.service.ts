/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { ICategory } from '../models/categories';
import {
  Observable
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IUser, nullUser } from '../../user-pages/models/users';
import { categoriesSource } from 'src/tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  categoriesUrl = categoriesSource;
  currentUser: IUser = { ...nullUser };

  constructor(private http: HttpClient) {}

  getCategory(id: number) {
    const options = { withCredentials: true };
    return this.http.get(`${this.categoriesUrl}/category/${id}`, options);
  }

  getShortCategoriesByRecipe(id: number): Observable<ICategory[]> {
    const options = { withCredentials: true };
    return this.http.get<ICategory[]>(
      this.categoriesUrl + '/by-recipe/' + id,
      options,
    );
  }

  getCategoriesBySearch(
    searchText: string,
    sectionId: number,
  ): Observable<any> {
    const url = `${this.categoriesUrl}/section/search/${sectionId}?search=${searchText}`;
    return this.http.get(url);
  }
  getCategoryForEditing(id: number): Observable<ICategory> {
    const options = { withCredentials: true };
    const url = `${this.categoriesUrl}/editing/${id}`;
    return this.http.get<ICategory>(url, options);
  }

  getPopularCategoriesBySearch(searchText: string): Observable<any> {
    const url = `${this.categoriesUrl}/popular/search/?search=${searchText}`;
    return this.http.get(url);
  }

  getPopularCategories() {
    const options = { withCredentials: true };

    return this.http.get<ICategory[]>(`${this.categoriesUrl}/popular`, options);
  }

  getCategoriesGroupsBySearch(searchText: string): Observable<any> {
    const url = `${this.categoriesUrl}/groups/search?search=${searchText}`;
    return this.http.get(url);
  }

  getAwaitsCategories(limit: number, page: number) {
    const options = { withCredentials: true };
    const url = `${this.categoriesUrl}/public?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }

  getSomeCategoriesOfSection(limit: number, page: number, sectionId: number) {
    const options = { withCredentials: true };

    const url = `${this.categoriesUrl}/some-section/${sectionId}?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }
  getSomePopularCategories(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.categoriesUrl}/some/popular?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }
  getAwaitingCategoriesCount() {
    const options = { withCredentials: true };

    const url = `${this.categoriesUrl}/awaits-count`;
    return this.http.get<number>(url, options);
  }
  getCategoriesOfSection(sectionId: number) {
    const options = { withCredentials: true };
    const url = `${this.categoriesUrl}/by-section/${sectionId}`;
    return this.http.get<ICategory[]>(url, options);
  }

  publishCategory(categoryId: number) {
    const options = { withCredentials: true };
    const url = `${this.categoriesUrl}/${categoryId}/publish`;
    return this.http.put(url, {}, options);
  }

  setImageToCategory(categoryId: number, filename: string) {
    const options = { withCredentials: true };

    return this.http.put(
      `${this.categoriesUrl}/image/${categoryId}`,
      {
        image: filename,
      },
      options,
    );
  }

  putCategory(updatedCategory: ICategory) {
    const options = { withCredentials: true };
    return this.http.put(
      `${this.categoriesUrl}/update/${updatedCategory.id}`,
      updatedCategory,
      options,
    );
  }

  uploadCategoryImage(file: File) {
    const options = { withCredentials: true };

    const formData: FormData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(`${this.categoriesUrl}/image`, formData, options);
  }

  deleteCategory(categoryId: number) {
    const options = { withCredentials: true };

    return this.http.delete(`${this.categoriesUrl}/${categoryId}`, options);
  }

  deleteImage(categoryId: number) {
    const options = { withCredentials: true };

    const url = `${this.categoriesUrl}/files/${categoryId}`;
    return this.http.delete(url, options);
  }

  getStatus(categoryId: number) {
    const options = { withCredentials: true };

    const url = `${this.categoriesUrl}/isAwaits/${categoryId}`;
    return this.http.get(url, options);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.categoriesUrl}/files/${filename}`;

    const options = {
      responseType: 'blob' as 'blob',
      withCredentials: true,
    };
    return this.http.get(fileUrl, options);
  }

  postCategory(newCategory: ICategory) {
    const options = { withCredentials: true };
    const url = `${this.categoriesUrl}/category`;
    return this.http.post(url, newCategory, options);
  }
}
