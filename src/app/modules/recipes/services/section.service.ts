import { Injectable } from '@angular/core';
import { ICategory, ISection, nullSection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { sectionsUrl } from 'src/tools/source';
import { IRecipe } from '../models/recipes';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  urlSections: string = sectionsUrl;

  sectionsSubject = new BehaviorSubject<ISection[]>([]);
  sections$ = this.sectionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadSectionData() {
    this.getSections().subscribe((data) => {
      this.sectionsSubject.next(data);
    });
  }

  getSectionsWithCategories(sections: ISection[],categories:ICategory[]): ISection[] {
    const sectionWithCategories: ISection[] = []
    sections.forEach((section) =>
    {
      const categoriesOfSection: ICategory[] = []
      section.categories.forEach(element => {
        const findCategory = categories.find((elem) => (elem.id === element && elem.status==='public'))
        if (findCategory) {
          categoriesOfSection.push(findCategory)
        }
        
      });
      if (categoriesOfSection.length > 0) {
        sectionWithCategories.push(section)
      }

    
    });
    return sectionWithCategories;
  }

  updateSections(section: ISection) {
    return this.http.put<ISection>(`${this.urlSections}/${section.id}`, section).pipe(
      tap((updatedSection: ISection) => {
        const curentSections = this.sectionsSubject.value;
        const index = curentSections.findIndex(
          (r) => r.id === updatedSection.id,
        );
        if (index !== -1) {
          const updatedSections = [...curentSections];
          updatedSections[index] = updatedSection;

          this.sectionsSubject.next(updatedSections);
        }
      }),
    );
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

  postSection(section: ISection) {
    return this.http.post<ISection>(this.urlSections, section).pipe(
      tap((newSection: ISection) => {
        const currentSections = this.sectionsSubject.value;
        const updatedSections = [...currentSections, newSection];
        this.sectionsSubject.next(updatedSections);
      }),
    );
  }

  getNotEmptySections(sections: ISection[]): ISection[] {
    return (sections = sections.filter(
      (section) => section.categories.length > 0,
    ));
  }

  getNumberRecipesOfSection(
    section: ISection,
    recipes: IRecipe[],
    categories: ICategory[],
  ): number {
    let sectionRecipesIds: number[] = [];
    section.categories.forEach((categoryId) => {
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
    return sectionRecipesIds.length;
  }

  getSectionOfCategory(sections: ISection[], category: ICategory): ISection {
    return (
      sections.find((section) => section.categories.includes(category.id)) ||
      nullSection
    );
  }
}
