import { Injectable } from '@angular/core';
import { ICategory, ISection, nullSection } from '../models/categories';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRecipe } from '../models/recipes';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  sectionsUrl = 'http://localhost:3000/sections';
  sectionsSubject = new BehaviorSubject<ISection[]>([]);
  sections$ = this.sectionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  updateSection(updatedSection: ISection) {
    return this.http.put(
      `${this.sectionsUrl}/${updatedSection.id}`,
      updatedSection,
    );
  }

  getSection(id: number): Observable<ISection> {
    const url = `${this.sectionsUrl}/some/${id}`;
    return this.http.get<ISection>(url);
  }

  getCategoriesAndSectionsBySearch(searchText: string) {
    const url = `${this.sectionsUrl}/global/search/?search=${searchText}`;
    return this.http.get(url);
  }

  getSectionsBySearch(searchText: string) {
    const url = `${this.sectionsUrl}/search/?search=${searchText}`;
    return this.http.get<ISection[]>(url);
  }

  getSomeSections(limit: number, page: number) {
    const url = `${this.sectionsUrl}/some?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  getAllAboutSomeSections(limit: number, page: number) {
    const url = `${this.sectionsUrl}/all?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  getImagesOfDeletedSectionCategories(sectionId: number): Observable<string[]> {
    const url = `${this.sectionsUrl}/images/${sectionId}`;
    return this.http.get<string[]>(url);
  }

  getAllAboutSomeNotEmptySections(limit: number, page: number,userId:number) {
    const url = `${this.sectionsUrl}/all-not-empty/${userId}?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  uploadSectionImage(file: File) {
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(`${this.sectionsUrl}/image`, formData);
  }

  getSectionShortInfoForAwaitingCategory(sectionId: number) {
    return this.http.get<ISection[]>(`${this.sectionsUrl}/short/${sectionId}`);
  }

  deleteSection(sectionId: number) {
    return this.http.delete(`${this.sectionsUrl}/${sectionId}`);
  }

  deleteImage(filename: string) {
    const url = `${this.sectionsUrl}/files/${filename}`;
    return this.http.delete(url);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.sectionsUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  setSections(sections: ISection[]) {
    this.sectionsSubject.next(sections);
  }

  public getSectionCategories(sectionId: number) {
    const url = `${this.sectionsUrl}/categories/${sectionId}`;
    return this.http.get<number[]>(url);
  }

  getSectionsWithCategories(
    sections: ISection[],
    categories: ICategory[],
  ): ISection[] {
    const sectionWithCategories: ISection[] = [];
    sections.forEach((section) => {
      const categoriesOfSection: ICategory[] = [];
      section.categoriesIds.forEach((element) => {
        const findCategory = categories.find(
          (elem) => elem.id === element && elem.status === 'public',
        );
        if (findCategory) {
          categoriesOfSection.push(findCategory);
        }
      });
      if (categoriesOfSection.length > 0) {
        sectionWithCategories.push(section);
      }
    });
    return sectionWithCategories;
  }

  postSection(newSection: ISection) {
    const url = `${this.sectionsUrl}`;
    return this.http.post(url, newSection);
  }

  getNotEmptySections(sections: ISection[]): ISection[] {
    return (sections = sections.filter(
      (section) => section.categoriesIds.length > 0,
    ));
  }

  getNumberRecipesOfSection(
    section: ISection,
    recipes: IRecipe[],
    categories: ICategory[],
  ): number {
    let sectionRecipesIds: number[] = [];
    if (section.categoriesIds && section.categoriesIds.length) {
      section.categoriesIds.forEach((categoryId) => {
        const currentCategory = categories.find(
          (category) => (category.id = categoryId),
        );
        if (currentCategory) {
          const categoryRecipesIds: number[] = [];
          recipes.forEach((recipe) => {
            if (recipe.categories.includes(currentCategory.id))
              categoryRecipesIds.push(recipe.id);
          });
          sectionRecipesIds = [...sectionRecipesIds, ...categoryRecipesIds];
        }
      });
      sectionRecipesIds = sectionRecipesIds.filter((recipeId, index, self) => {
        return self.indexOf(recipeId) === index;
      });
    }
    return sectionRecipesIds.length;
  }

  getSomeFullSections(limit: number, page: number, userId: number) {
    const url = `${this.sectionsUrl}/some-full/${userId}?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  getSectionOfCategory(sections: ISection[], category: ICategory): ISection {
    return (
      sections.find((section) => section.categoriesIds.includes(category.id)) ||
      nullSection
    );
  }

  updateSectionInSection(section: ISection) {
    const currentSections = this.sectionsSubject.value;
    const index = currentSections.findIndex((r) => r.id === section.id);
    if (index !== -1) {
      const updatedSections = [...currentSections];
      updatedSections[index] = section;

      this.sectionsSubject.next(updatedSections);
    }
  }

  addSectionToSections(section: ISection) {
    const currentSections = this.sectionsSubject.value;
    const updatedSections = [...currentSections, section];
    this.sectionsSubject.next(updatedSections);
  }
  deleteSectionFromSections(section: ISection) {
    this.sectionsSubject.next(
      this.sectionsSubject.value.filter(
        (categories) => categories.id !== section.id,
      ),
    );
  }
}
