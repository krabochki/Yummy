/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { ICategory, ISection } from '../models/categories';
import { BehaviorSubject } from 'rxjs';
import { IRecipe } from '../models/recipes';
import { supabase } from '../../controls/image/supabase-data';

interface CategoryCounts {
  [categoryId: number]: number;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {

  private categoriesSubject = new BehaviorSubject<ICategory[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(){
    
  }

  getMaxCategoryId() {
    return supabase
      .from('categories')
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

  loadCategoriesFromSupabase() {
   return supabase
      .from('categories')
      .select('*')
      .then((response) => {
        const supCategories = response.data;
        const categories = supCategories?.map((supCategory) => {
          return this.translateCategory(supCategory);
        });
        if (categories) this.categoriesSubject.next(categories);
      });
  }

  private translateCategory(category: any): ICategory {
    return {
      id: category.id,
      name: category.name,
      photo: category.photo,
      authorId: category.authorid,
      status: category.status,
      sendDate: category.senddate,
    } as ICategory;
  }
   addCategoryToSupabase(category:ICategory) {
    return supabase.from('categories').upsert([
      {
        id: category.id,
        name: category.name,
        photo: category.photo,
        authorid: category.authorId,
        status: category.status,
        senddate: category.sendDate,
      },
    ]);
  }
  deleteCategoryFromSupabase(id: number) {
    return supabase.from('categories').delete().eq('id', id);
  }
  updateCategoryInSupabase(category: ICategory) {
    const { id, ...updateData } = category;
    return supabase
      .from('categories')
      .update({
        id: category.id,
        name: category.name,
        photo: category.photo,
        authorid: category.authorId,
        status: category.status,
        senddate: category.sendDate,
      })
      .eq('id', id);
  }

  updateCategoriesAfterUPSERT(payload: any) {
    const currentCategories = this.categoriesSubject.value;
    const index = currentCategories.findIndex(
      (r) => r.id === this.translateCategory(payload).id,
    );
    if (index !== -1) {
      const updatedCategories = [...currentCategories];
      updatedCategories[index] = this.translateCategory(payload);

      this.categoriesSubject.next(updatedCategories);
    }
  }

  updateCategoriesAfterINSERT(payload: any) {
    const currentUsers = this.categoriesSubject.value;
    const updatedCategories = [
      ...currentUsers,
      this.translateCategory(payload),
    ];
    this.categoriesSubject.next(updatedCategories);
  }
  updateCategoriesAfterDELETE(payload: any) {
    this.categoriesSubject.next(
      this.categoriesSubject.value.filter(
        (categories) => categories.id !== this.translateCategory(payload).id,
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
      if (section.categories.includes(category.id)) {
        findedCategories.push(category);
      }
    });

    return findedCategories;
  }

  sortCategoriesByName(categories: ICategory[]): ICategory[] {
    return categories.sort((category1: ICategory, category2: ICategory) =>
      category1.name > category2.name ? 1 : -1,
    );
  }

  getPopularCategories(categories: ICategory[], recipes: IRecipe[]) {
    // Создаем объект, в котором ключами будут ID категорий, а значениями количество рецептов в каждой категории
    const categoryCounts: CategoryCounts = {};
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

}
