import { Injectable } from '@angular/core';
import { ICategory, ISection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  urlCategories: string = 'http://localhost:3000/categories';
  urlSections: string = 'http://localhost:3000/sections';

  private categoriesSubject = new BehaviorSubject<ICategory[]>([]);
  categories$ = this.categoriesSubject.asObservable();
  private sectionsSubject = new BehaviorSubject<ISection[]>([]);
  sections$ = this.sectionsSubject.asObservable();

  constructor(private http: HttpClient) {

      this.getSections().subscribe((data) => {
        this.sectionsSubject.next(data);
      });
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

  getSections() {
    return this.http.get<ISection[]>(this.urlSections);
  }

  getSection(id: number) {
    return this.http.get<ISection>(`${this.urlSections}/${id}`);
  }

  deleteSection(id: number) {
    return this.http.delete<ISection>(`${this.urlSections}/${id}`);
  }

  postSection(category: ISection) {
    return this.http.post<ISection>(this.urlSections, category);
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
  updateSection(section: ISection) {
    return this.http.put<ICategory>(
      `${this.urlCategories}/${section.id}`,
      section,
    );
  }
}
