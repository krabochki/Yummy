/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { ICategory, ISection } from '../models/categories';
import { BehaviorSubject, Observable, catchError, forkJoin, of, tap } from 'rxjs';
import { IRecipe } from '../models/recipes';
import { HttpClient } from '@angular/common/http';
import { IUser, nullUser } from '../../user-pages/models/users';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  categoriesSubject = new BehaviorSubject<ICategory[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  categoriesUrl = 'http://localhost:3000/categories';

  isInitialize = false;

  currentUser: IUser = { ...nullUser };

  constructor(private http: HttpClient) {}

  getCategory(id: number) {
    return this.http.get(this.categoriesUrl + '/category/' + id);
  }

  getShortCategoriesByRecipe(id: number): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(this.categoriesUrl + '/by-recipe/' + id);
  }

  getCategoriesBySearch(
    searchText: string,
    sectionId: number,
  ): Observable<any> {
    const url = `${this.categoriesUrl}/section/search/${sectionId}?search=${searchText}`;
    return this.http.get(url);
  }
  getCategoryForEditing(
    id: number,
  ): Observable<ICategory> {
    const url = `${this.categoriesUrl}/editing/${id}`;
    return this.http.get<ICategory>(url);
  }

  getPopularCategoriesBySearch(searchText: string): Observable<any> {
    const url = `${this.categoriesUrl}/popular/search/?search=${searchText}`;
    return this.http.get(url);
  }

  getPopularCategories(userId: number) {
    return this.http.get<ICategory[]>(
      `${this.categoriesUrl}/popular/${userId}`,
    );
  }
  getRecipeCount(categoryId: number, userId: number) {
    return this.http.get(
      `${this.categoriesUrl}/recipeCount/${categoryId}/${userId}`,
    );
  }

  getCategoriesGroupsBySearch(searchText: string): Observable<any> {
    const url = `${this.categoriesUrl}/groups/search?search=${searchText}`;
    return this.http.get(url);
  }

  getCategoriesGroupsWithoutSectionBySearch(
    searchText: string,
  ): Observable<any> {
    const url = `${this.categoriesUrl}/empty-groups/search?search=${searchText}`;
    return this.http.get(url);
  }

  getAwaitsCategories(limit: number, page: number) {
    const url = `${this.categoriesUrl}/public?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  getSomeCategoriesOfSection(
    limit: number,
    page: number,
    sectionId: number,
    userId: number,
  ) {
    const url = `${this.categoriesUrl}/some-section/${sectionId}/${userId}?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }
  getSomePopularCategories(limit: number, page: number, userId: number) {
    const url = `${this.categoriesUrl}/some/popular/${userId}?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }
  getAwaitingCategoriesCount() {
    const url = `${this.categoriesUrl}/awaits-count`;
    return this.http.get<number>(url);
  }
  getCategoriesOfSection(sectionId: number, userId: number) {
    const url = `${this.categoriesUrl}/by-section/${sectionId}/${userId}`;
    return this.http.get<ICategory[]>(url);
  }

  getShortCategoriesOfSection(sectionId: number) {
    const url = `${this.categoriesUrl}/by-section/short/${sectionId}`;
    return this.http.get<ICategory[]>(url);
  }

  getPublicCategories() {
    return this.http.get<ICategory[]>(this.categoriesUrl);
  }

  setCategories(categories: ICategory[]) {
    this.categoriesSubject.next(categories);
  }

  setSectionToCategory(sectionId: number, categoryId: number) {
    const url = `${this.categoriesUrl}/set-section/${categoryId}`;
    return this.http.put(url, { id: sectionId });
  }

  unsetSectionInCategory(categoryId: number) {
    const url = `${this.categoriesUrl}/unset-section/${categoryId}`;
    return this.http.put(url, {});
  }

  updateCategoryInCategories(category: ICategory) {
    const currentCategories = this.categoriesSubject.value;
    const index = currentCategories.findIndex((r) => r.id === category.id);
    if (index !== -1) {
      const updatedCategories = [...currentCategories];
      updatedCategories[index] = category;

      this.categoriesSubject.next(updatedCategories);
    }
  }

  addCategoryToCategories(category: ICategory) {
    const currentCategories = this.categoriesSubject.value;
    const index = currentCategories.findIndex((r) => r.id === category.id);
    if (index !== -1) {
      this.updateCategoryInCategories(category);
    } else {
      const currentUsers = this.categoriesSubject.value;
      const updatedCategories = [...currentUsers, category];
      this.categoriesSubject.next(updatedCategories);
    }
  }
  deleteCategoryFromCategories(category: ICategory) {
    this.categoriesSubject.next(
      this.categoriesSubject.value.filter(
        (categories) => categories.id !== category.id,
      ),
    );
  }

  getRelatedCategories(
    recipes: IRecipe[],
    categories: ICategory[],
  ): ICategory[] {
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

  getCategoriesBySection(
    section: ISection,
    categories: ICategory[],
  ): ICategory[] {
    const findedCategories: ICategory[] = [];
    categories.forEach((category) => {
      if (section.categoriesIds.includes(category.id)) {
        findedCategories.push(category);
      }
    });

    return findedCategories;
  }

  publishCategory(categoryId: number) {
    const url = `${this.categoriesUrl}/${categoryId}/publish`;
    return this.http.put(url, {});
  }

  sortCategoriesByName(categories: ICategory[]): ICategory[] {
    return categories.sort((category1: ICategory, category2: ICategory) =>
      category1.name > category2.name ? 1 : -1,
    );
  }

  updateCategory(updatedCategory: ICategory) {
    return this.http.put(
      `${this.categoriesUrl}/${updatedCategory.id}`,
      updatedCategory,
    );
  }

  uploadCategoryImage(file: File) {
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(`${this.categoriesUrl}/image`, formData);
  }

  deleteCategory(categoryId: number) {
    return this.http.delete(`${this.categoriesUrl}/${categoryId}`);
  }

  deleteImage(filename: string) {
    const url = `${this.categoriesUrl}/files/${filename}`;
    return this.http.delete(url);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.categoriesUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  postCategory(newCategory: ICategory) {
    const url = `${this.categoriesUrl}`;
    return this.http.post(url, newCategory);
  }
}
