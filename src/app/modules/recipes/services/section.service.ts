import { Injectable } from '@angular/core';
import { ICategory, ISection, nullSection } from '../models/categories';
import { BehaviorSubject } from 'rxjs';
import { sectionsUrl } from 'src/tools/source';
import { IRecipe } from '../models/recipes';
import { supabase } from '../../controls/image/supabase-data';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  urlSections: string = sectionsUrl;

  sectionsSubject = new BehaviorSubject<ISection[]>([]);
  sections$ = this.sectionsSubject.asObservable();

  loadSectionData() {
    return this.loadSectionsFromSupabase();
  }

  getSectionsWithCategories(
    sections: ISection[],
    categories: ICategory[],
  ): ISection[] {
    const sectionWithCategories: ISection[] = [];
    sections.forEach((section) => {
      const categoriesOfSection: ICategory[] = [];
      section.categories.forEach((element) => {
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

  getMaxCategoryId() {
    return supabase
      .from('sections')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .then((response) => {
        if (response.data && response.data.length > 0) {
          return response.data[0].id;
        } else {
          return 0;
        }
      });
  }

  loadSectionsFromSupabase() {
    return supabase
      .from('sections')
      .select('*')
      .then((response) => {
        const sSections = response.data;
        const sections = sSections?.map((sSections) => {
          return this.translateSection(sSections);
        });
        if (sections) this.sectionsSubject.next(sections);
      });
  }

  private translateSection(section: any): ISection {
    return {
      id: section.id,
      name: section.name,
      photo: section.photo,
      categories: section.categories,
    } as ISection;
  }
  addSectionToSupabase(section: ISection) {
    return supabase.from('sections').upsert([
      {
        id: section.id,
        name: section.name,
        photo: section.photo,
        categories: section.categories,
      },
    ]);
  }
  deleteSectionFromSupabase(id: number) {
    return supabase.from('sections').delete().eq('id', id);
  }
  async updateSectionInSupabase(section: ISection) {
    const { id, ...updateData } = section;
    await supabase
      .from('sections')
      .update({
        id: section.id,
        name: section.name,
        photo: section.photo,
        categories: section.categories,
      })
      .eq('id', id);
  }

  updateSectionsAfterUPSERT(payload: any) {
    const currentSections = this.sectionsSubject.value;
    const index = currentSections.findIndex(
      (r) => r.id === this.translateSection(payload).id,
    );
    if (index !== -1) {
      const updatedSections = [...currentSections];
      updatedSections[index] = this.translateSection(payload);

      this.sectionsSubject.next(updatedSections);
    }
  }

  updateCategoriesAfterINSERT(payload: any) {
    const currentSections = this.sectionsSubject.value;
    const updatedSections = [
      ...currentSections,
      this.translateSection(payload),
    ];
    this.sectionsSubject.next(updatedSections);
  }
  updateCategoriesAfterDELETE(payload: any) {
    this.sectionsSubject.next(
      this.sectionsSubject.value.filter(
        (categories) => categories.id !== this.translateSection(payload).id,
      ),
    );
  }
}
