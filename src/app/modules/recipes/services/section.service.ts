import { Injectable } from '@angular/core';
import { ICategory, ISection, nullSection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { sectionsUrl } from 'src/tools/source';
import { IRecipe } from '../models/recipes';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  urlSections: string = sectionsUrl

  sectionsSubject = new BehaviorSubject<ISection[]>([]);
  sections$ = this.sectionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadSectionData() {
    this.getSections().subscribe((data) => {
      this.sectionsSubject.next(data);
    });
  }

  getSectionsWithCategories(sections:ISection[]):ISection[] {
    return sections.filter((section:ISection)=> section.categoriesId.length>0)
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

  getNotEmptySections(sections: ISection[]): ISection[] {
    return (sections = sections.filter(
      (section) => section.categoriesId.length > 0,
    ));
  }

  getNumberRecipesOfSection(section: ISection, recipes: IRecipe[], categories: ICategory[]): number{
    let sectionRecipesIds:number[] = []
    section.categoriesId.forEach((categoryId) => {

      const currentCategory = categories.find((category) => category.id = categoryId)
      if (currentCategory) {
        const categoryRecipesIds: number[] = [];
        recipes.forEach((recipe) => {
          if(recipe.categories.includes(currentCategory.id)) categoryRecipesIds.push(recipe.id)
        }) 
        sectionRecipesIds = [ ...sectionRecipesIds, ...categoryRecipesIds]
      }

    });
    sectionRecipesIds = sectionRecipesIds.filter((recipeId, index, self) => {
      return self.indexOf(recipeId) === index;
    });
    return sectionRecipesIds.length;
  }

  getSectionOfCategory(sections:ISection[], category: ICategory): ISection {
      return (
        sections.find((section) =>
          section.categoriesId.includes(category.id),
        ) || nullSection
      );
  }
}
