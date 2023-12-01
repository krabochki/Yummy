import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { IRecipe } from '../models/recipes';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
} from '../models/ingredients';
import { RecipeService } from './recipe.service';
import { baseComparator } from 'src/tools/common';
import { supabase } from '../../controls/image/supabase-data';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {

  ingredientSubject = new BehaviorSubject<IIngredient[]>([]);
  ingredients$ = this.ingredientSubject.asObservable();

  ingredientGroupsSubject = new BehaviorSubject<IIngredientsGroup[]>([]);
  ingredientsGroups$ = this.ingredientGroupsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
  ) {}

  loadIngredientsGroupsData() {
    return this.loadGroupsFromSupabase();
  }

  loadIngredientsData() {
    return this.loadIngredientsFromSupabase();
  }

  getAllNamesOfIngredient(ingredient: IIngredient): string[] {
    const ingridientName = ingredient.name.toLowerCase().trim();
    const variations = ingredient.variations.map((variation) =>
      variation.trim().toLowerCase(),
    );
    return [ingridientName, ...variations];
  }
  getRelatedIngredients(ingredient: IIngredient, ingredients: IIngredient[]) {
    const targetName = ingredient.name.trim().toLowerCase();

    const targetVariations = ingredient.variations.map((variation) =>
      variation.trim().toLowerCase(),
    );

    let relatedIngredients = ingredients.filter((ing) => {
      const currentName = ing.name.trim().toLowerCase();
      if (currentName.includes(targetName)) {
        return true;
      }
      if (targetName.includes(currentName)) {
        return true;
      }

      const currentVariations = ing.variations.map((variation) =>
        variation.trim().toLowerCase(),
      );
      return targetVariations.some((targetVar) =>
        currentVariations.includes(targetVar),
      );
    });
    relatedIngredients = relatedIngredients.filter(
      (i) => i.id !== ingredient.id,
    );

    return relatedIngredients;
  }



  getRecipesNumberOfGroup(
    group: IIngredientsGroup,
    ingredients: IIngredient[],
    recipes: IRecipe[],
  ) {
    let recipesIdsInGroup: number[] = [];
    if (group.ingredients) {
      group.ingredients.forEach((ingredient) => {
        const findedIngredient =
          ingredients.find((i) => i.id === ingredient) || nullIngredient;
        if (findedIngredient.id > 0) {
          const findedRecipesByIngredient =
            this.recipeService.getRecipesByIngredient(
              recipes,
              findedIngredient,
            );
          const findedRecipesByIngredientIds: number[] =
            findedRecipesByIngredient.map((recipe) => recipe.id);
          recipesIdsInGroup = [
            ...recipesIdsInGroup,
            ...findedRecipesByIngredientIds,
          ];
        }
      });
    }
    return Array.from(new Set(recipesIdsInGroup)).length;
  }

  findAllIngrdientsFitByName(name: string, ingredients: IIngredient[]) {
    const findedIngredients: IIngredient[] = [];
    const searchName = name.toLowerCase().trim();
    ingredients.forEach((ingredient) => {
      const formatIngredient = ingredient.name.toLowerCase().trim();
      const variationsMatch =
        ingredient.variations.length > 0 &&
        ingredient.variations.some((variation) => {
          const formattedVariation = variation.toLowerCase().trim();
          return searchName.includes(formattedVariation);
        });

      if (searchName.includes(formatIngredient) || variationsMatch) {
        findedIngredients.push(ingredient);
      }
    });
    return findedIngredients;
  }

  findIngredientByName(name: string, ingredients: IIngredient[]): IIngredient {
    const findedIngredients: IIngredient[] = [];
    const ingredientName = name.toLowerCase().trim();
    ingredients.forEach((ingredient) => {
      const variationsMatch =
        ingredient.variations.length > 0 &&
        ingredient.variations.some((variation) => {
          const formattedVariation = variation.toLowerCase().trim();
          return ingredientName.includes(formattedVariation);
        });

      if (
        ingredientName.includes(ingredient.name.toLowerCase().trim()) ||
        variationsMatch
      ) {
        findedIngredients.push(ingredient);
      }
    });
    const findIngredient =
      findedIngredients.sort((a, b) => baseComparator(b.name, a.name))[0] ||
      nullIngredient;
    return findIngredient;
  }

  sortIngredients(ingredients: IIngredient[], recipes: IRecipe[]) {
    return ingredients.sort((a, b) => {
      if (
        this.recipeService.getRecipesByIngredient(recipes, b) >
        this.recipeService.getRecipesByIngredient(recipes, a)
      )
        return 1;
      else if (
        this.recipeService.getRecipesByIngredient(recipes, b) ===
        this.recipeService.getRecipesByIngredient(recipes, a)
      )
        return baseComparator(a.name, b.name);
      else {
        return -1;
      }
    });
  }

  getGroupOfIngredient(
    groups: IIngredientsGroup[],
    ingredient: IIngredient,
  ): IIngredientsGroup[] {
    return (
      groups.filter(
        (group) =>
          group.ingredients.length > 0 &&
          group.ingredients.includes(ingredient.id),
      ) || []
    );
  }

  getIngredientsOfGroup(
    group: IIngredientsGroup,
    ingredients: IIngredient[],
  ): IIngredient[] {
    return ingredients.filter((i) => group.ingredients.includes(i.id));
  }

  getMaxIngredientId() {
    return supabase
      .from('ingredients')
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

  getMaxGroupId() {
    return supabase
      .from('groups')
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

  loadIngredientsFromSupabase() {
    return supabase
      .from('ingredients')
      .select('*')
      .then((response) => {
        const supCategories = response.data;
        const categories = supCategories?.map((supCategory) => {
          return this.translateIngredient(supCategory);
        });
        if (categories) this.ingredientSubject.next(categories);
      });
  }

  loadGroupsFromSupabase() {
    return supabase
      .from('groups')
      .select('*')
      .then((response) => {
        const sGroups = response.data;
        const groups = sGroups?.map((sGroup) => {
          return this.translateGroup(sGroup);
        });
        if (groups) this.ingredientGroupsSubject.next(groups);
      });
  }
  private translateGroup(group: any): IIngredientsGroup {
    return {
      id: group.id,
      name: group.name,
      ingredients: group.ingredients,
      image: group.image,
    } as IIngredientsGroup;
  }
  private translateIngredient(ingredient: any): IIngredient {
    return {
      id: ingredient.id,
      name: ingredient.name,
      history: ingredient.history,
      description: ingredient.description,
      variations: ingredient.variations,
      advantages: ingredient.advantages,
      disadvantages: ingredient.disadvantages,
      recommendedTo: ingredient.recommendedto,
      contraindicatedTo: ingredient.contraindicatedto,
      status: ingredient.status,
      origin: ingredient.origin,
      precautions: ingredient.precautions, //меры предосторожности
      compatibleDishes: ingredient.compatibledishes, // с чем сочетается
      cookingMethods: ingredient.cookingmethods, //как готовить
      tips: ingredient.tips,
      author: ingredient.author,
      sendDate: ingredient.senddate,
      nutritions: ingredient.nutritions,
      storageMethods: ingredient.storagemethods, //способы хранения
      externalLinks: ingredient.externallinks, //доп ресурсы
      shoppingListGroup: ingredient.shoppinglistgroup, //основное
      image: ingredient.image,
    } as IIngredient;
  }
  addIngredientToSupabase(ingredient: IIngredient) {
    return supabase.from('ingredients').upsert([
      {
        id: ingredient.id,
        name: ingredient.name,
        history: ingredient.history,
        description: ingredient.description,
        variations: ingredient.variations,
        advantages: ingredient.advantages,
        disadvantages: ingredient.disadvantages,
        recommendedto: ingredient.recommendedTo,
        contraindicatedto: ingredient.contraindicatedTo,
        status: ingredient.status,
        origin: ingredient.origin,
        precautions: ingredient.precautions, //меры предосторожности
        compatibledishes: ingredient.compatibleDishes, // с чем сочетается
        cookingmethods: ingredient.cookingMethods, //как готовить
        tips: ingredient.tips,
        author: ingredient.author,
        senddate: ingredient.sendDate,
        nutritions: ingredient.nutritions,
        storagemethods: ingredient.storageMethods, //способы хранения
        externallinks: ingredient.externalLinks, //доп ресурсы
        shoppinglistgroup: ingredient.shoppingListGroup, //основное
        image: ingredient.image,
      },
    ]);
  }
  addGroupToSupabase(group: IIngredientsGroup) {
    return supabase.from('groups').upsert([
      {
        id: group.id,
        name: group.name,
        ingredients: group.ingredients,
        image: group.image,
      },
    ]);
  }
  deleteIngredientFromSupabase(id: number) {
    return supabase.from('ingredients').delete().eq('id', id);
  }
  deleteGroupFromSupabase(id: number) {
    return supabase.from('groups').delete().eq('id', id);
  }
  updateIngredientInSupabase(ingredient: IIngredient) {
    const { id, ...updateData } = ingredient;
    return supabase
      .from('ingredients')
      .update({
        id: ingredient.id,
        name: ingredient.name,
        history: ingredient.history,
        description: ingredient.description,
        variations: ingredient.variations,
        advantages: ingredient.advantages,
        disadvantages: ingredient.disadvantages,
        recommendedto: ingredient.recommendedTo,
        contraindicatedto: ingredient.contraindicatedTo,
        status: ingredient.status,
        origin: ingredient.origin,
        precautions: ingredient.precautions, //меры предосторожности
        compatibledishes: ingredient.compatibleDishes, // с чем сочетается
        cookingmethods: ingredient.cookingMethods, //как готовить
        tips: ingredient.tips,
        author: ingredient.author,
        senddate: ingredient.sendDate,
        nutritions: ingredient.nutritions,
        storagemethods: ingredient.storageMethods, //способы хранения
        externallinks: ingredient.externalLinks, //доп ресурсы
        shoppinglistgroup: ingredient.shoppingListGroup, //основное
        image: ingredient.image,
      })
      .eq('id', id);
  }
  updateGroupInSupabase(group: IIngredientsGroup) {
    const { id, ...updateData } = group;
    return supabase
      .from('groups')
      .update({
        id: group.id,
        name: group.name,
        ingredients: group.ingredients,
        image: group.image,
      })
      .eq('id', id);
  }

  updateIngredientsAfterUPSERT(payload: any) {
    const currentCategories = this.ingredientSubject.value;
    const index = currentCategories.findIndex(
      (r) => r.id === this.translateIngredient(payload).id,
    );
    if (index !== -1) {
      const updatedCategories = [...currentCategories];
      updatedCategories[index] = this.translateIngredient(payload);

      this.ingredientSubject.next(updatedCategories);
    }
  }
  updateGroupsAfterUPSERT(payload: any) {
    const currentGroups = this.ingredientGroupsSubject.value;
    const index = currentGroups.findIndex(
      (r) => r.id === this.translateGroup(payload).id,
    );
    if (index !== -1) {
      const updatedGroups = [...currentGroups];
      updatedGroups[index] = this.translateGroup(payload);

      this.ingredientGroupsSubject.next(updatedGroups);
    }
  }
  updateGroupsAfterINSERT(payload: any) {
    const currentGroups = this.ingredientGroupsSubject.value;
    const updatedGroups = [...currentGroups, this.translateGroup(payload)];
    this.ingredientGroupsSubject.next(updatedGroups);
  }

  updateIngredientsAfterINSERT(payload: any) {
    const currentUsers = this.ingredientSubject.value;
    const updatedCategories = [
      ...currentUsers,
      this.translateIngredient(payload),
    ];
    this.ingredientSubject.next(updatedCategories);
  }
  updateIngredientsAfterDELETE(payload: any) {
    return this.ingredientSubject.next(
      this.ingredientSubject.value.filter(
        (ingredients) =>
          ingredients.id !== this.translateIngredient(payload).id,
      ),
    );
  }
  updateGroupsAfterDELETE(payload: any) {
    return this.ingredientGroupsSubject.next(
      this.ingredientGroupsSubject.value.filter(
        (group) => group.id !== this.translateIngredient(payload).id,
      ),
    );
  }
}
