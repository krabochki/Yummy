import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe, IRecipeStatistics } from '../models/recipes';
import { BehaviorSubject, Observable, from, tap } from 'rxjs';
import { recipesUrl } from 'src/tools/source';
import { getCurrentDate } from 'src/tools/common';
import { IPlan } from '../../planning/models/plan';
import { IUser } from '../../user-pages/models/users';
import { UserService } from '../../user-pages/services/user.service';
import { IIngredient } from '../models/ingredients';
import { supabase } from '../../controls/image/supabase-data';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  recipesSubject = new BehaviorSubject<IRecipe[]>([]);
  recipes$ = this.recipesSubject.asObservable();

  url: string = recipesUrl;

  constructor(
    private http: HttpClient,
    private userService: UserService,
  ) {}

  loadRecipeData() {
    return this.getRecipesFromSupabase();
  }

  getRecipesWhithIsEditedWhenUserDeleting(
    recipes: IRecipe[],
    user: IUser,
  ): IRecipe[] {
    const editedRecipes: IRecipe[] = [];
    recipes.forEach((recipe) => {
      let anyChanges: boolean = false;

      if (recipe.authorId !== user.id || recipe.status === 'public') {
        if (recipe.likesId.includes(user.id)) {
          anyChanges = true;
          recipe.likesId = recipe.likesId.filter(
            (element) => element !== user.id,
          );
        }
        if (recipe.favoritesId.includes(user.id)) {
          anyChanges = true;
          recipe.favoritesId = recipe.favoritesId.filter(
            (element) => element !== user.id,
          );
        }
        if (recipe.cooksId.includes(user.id)) {
          anyChanges = true;
          recipe.cooksId = recipe.cooksId.filter(
            (element) => element !== user.id,
          );
        }
        if (recipe.comments) {
          const beginLength = recipe.comments.length
            ? recipe.comments.length
            : 0;

          recipe.comments.forEach((com) => {
            if (
              com.dislikesId.includes(user.id) ||
              com.likesId.includes(user.id)
            ) {
              anyChanges = true;
              com.dislikesId = com.dislikesId.filter((d) => d !== user.id);
              com.likesId = com.likesId.filter((l) => l !== user.id);
            }
          });
          recipe.comments = recipe.comments.filter(
            (element) => element.authorId !== user.id,
          );
          const endLength = recipe.comments.length ? recipe.comments.length : 0;
          if (endLength < beginLength) anyChanges = true;
        }

        if (recipe.reports) {
          const beginLength = recipe.reports.length ? recipe.reports.length : 0;
          recipe.reports = recipe.reports.filter(
            (element) => element.reporter !== user.id,
          );
          const endLength = recipe.reports.length ? recipe.reports.length : 0;
          if (endLength < beginLength) anyChanges = true;
        }
        if (recipe.statistics) {
          const beginLength = recipe.statistics.length
            ? recipe.statistics.length
            : 0;
          recipe.statistics = recipe.statistics.filter(
            (element) => element.user !== user.id,
          );
          const endLength = recipe.statistics.length
            ? recipe.statistics.length
            : 0;
          if (endLength < beginLength) anyChanges = true;
        }

        if (recipe.authorId === user.id && recipe.status === 'public') {
          anyChanges = true;
          recipe.authorId = -1;
        }
      }

      if (anyChanges) {
        editedRecipes.push(recipe);
      }
    });
    return editedRecipes;
  }

  getRecipesThatWillBeDeletedAfterUserDeleting(
    recipes: IRecipe[],
    user: IUser,
  ): IRecipe[] {
    const recipesForDeleting: IRecipe[] = [];
    recipes.forEach((recipe) => {
      if (recipe.authorId === user.id && recipe.status !== 'public')
        recipesForDeleting.push(recipe);
    });
    return recipesForDeleting;
  }


  getRecipesFromSupabase() {
    
    return supabase
      .from('recipes')
      .select('*')
      .then((response) => {
        const supRecipes = response.data;
        const recipes = supRecipes?.map((recipe) => {
          return this.translateRecipe(recipe);
        });
        if (recipes) this.recipesSubject.next(recipes);
      });
  }

  translateRecipe(recipe: any) {
    return {
      // Добавьте все нужные поля с правильными именами сюда
      id: recipe.id || 0,
      mainImage: recipe.mainimage || '',
      name: recipe.name || '',
      description: recipe.description || '',
      preparationTime: recipe.preparationtime || '',
      cookingTime: recipe.cookingtime || '',
      servings: recipe.servings || 0,
      origin: recipe.origin || '',
      ingredients: recipe.ingredients || [],
      nutritions: recipe.nutritions || [],
      instructions: recipe.instructions || [],
      categories: recipe.categories || [],
      authorId: recipe.authorid || 0,
      likesId: recipe.likesid || [],
      cooksId: recipe.cooksid || [],
      history: recipe.history || '',
      comments: recipe.comments || [],
      publicationDate: recipe.publicationdate || '',
      favoritesId: recipe.favoritesid || [], // Указывайте поля с правильными именами
      status: recipe.status || 'public',
      reports: recipe.reports || [],
      statistics: recipe.statistics || [],
    } as IRecipe;
  }

  deleteExistingRecipe(payload: any) {
    this.recipesSubject.next(
      this.recipesSubject.value.filter((recipe) => recipe.id !== this.translateRecipe(payload).id),
    );
  }

  getMaxRecipeId() {
    return supabase
      .from('recipes')
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

  addNewRecipe(payload: any) {
    const currentRecipes = this.recipesSubject.value;
    const updatedRecipes = [...currentRecipes, this.translateRecipe(payload)];
    this.recipesSubject.next(updatedRecipes);
  }

  approveRecipe(recipe: IRecipe): IRecipe {
    recipe.status = 'public';
    recipe.publicationDate = getCurrentDate();
    return recipe;
  }

  dismissRecipe(recipe: IRecipe): IRecipe {
    recipe.status = 'private';
    return recipe;
  }

  uploadExistingRecipe(payload: any) {
    const currentRecipes = this.recipesSubject.value;
    const index = currentRecipes.findIndex(
      (r) => r.id === this.translateRecipe(payload).id,
    );
    if (index !== -1) {
      const updatedRecipes = [...currentRecipes];
      updatedRecipes[index] = this.translateRecipe(payload);

      this.recipesSubject.next(updatedRecipes);
    }
  }

  removeRecipeFunction(recipeId: number) {
    return supabase.from('recipes').delete().eq('id', recipeId);
  }

  updateRecipeFunction(recipe: IRecipe) {
    const { id, ...updateData } = recipe;

    return supabase
      .from('recipes')
      .update({
        mainimage: recipe.mainImage,
        name: recipe.name,
        description: recipe.description,
        preparationtime: recipe.preparationTime,
        cookingtime: recipe.cookingTime,
        servings: recipe.servings,
        origin: recipe.origin,
        ingredients: recipe.ingredients,
        nutritions: recipe.nutritions,
        instructions: recipe.instructions,
        categories: recipe.categories,
        authorid: recipe.authorId,
        likesid: recipe.likesId,
        cooksid: recipe.cooksId,
        history: recipe.history,
        comments: recipe.comments,
        publicationdate: recipe.publicationDate,
        favoritesid: recipe.favoritesId,
        status: recipe.status,
        reports: recipe.reports,
        statistics: recipe.statistics,
      })
      .eq('id', id);
  }
  
  getFavoriteRecipesByUser(recipes: IRecipe[], user: number) {
    return recipes.filter((recipe) => recipe.favoritesId.includes(user));
  }
  getLikedRecipesByUser(recipes: IRecipe[], user: number) {
    return recipes.filter((recipe) => recipe.likesId.includes(user));
  }
  getCommentedRecipesByUser(recipes: IRecipe[], userId: number) {
    recipes = recipes.filter((recipe) => recipe.comments.length > 0);
    const userCommentedRecipes: IRecipe[] = [];
    const addedRecipeIds = new Set<number>();

    recipes.forEach((element) => {
      element.comments.forEach((comment) => {
        if (comment.authorId === userId && !addedRecipeIds.has(element.id)) {
          userCommentedRecipes.push(element);
          addedRecipeIds.add(element.id);
        }
      });
    });

    return userCommentedRecipes;
  }

  voteForRecipe(recipe: IRecipe, userId: number, userChoice: boolean): IRecipe {
    const statistic: IRecipeStatistics = {
      user: userId,
      answer: userChoice,
    };
    if (!recipe.statistics) recipe.statistics = [];
    recipe.statistics.push(statistic);
    return recipe;
  }
  removeVote(recipe: IRecipe, userId: number): IRecipe {
    if (!recipe.statistics) recipe.statistics = [];

    recipe.statistics = recipe.statistics.filter(
      (stat) => stat.user !== userId,
    );
    return recipe;
  }
  getCookedRecipesByUser(recipes: IRecipe[], user: number) {
    return recipes.filter((recipe) => recipe.cooksId.includes(user));
  }
  getPopularRecipes(recipes: IRecipe[]) {
    return recipes.sort((a, b) => b.likesId.length - a.likesId.length);
  }
  getMostCookedRecipes(recipes: IRecipe[]) {
    return recipes.sort((a, b) => b.cooksId.length - a.cooksId.length);
  }
  getMostFavoriteRecipes(recipes: IRecipe[]) {
    return recipes.sort((a, b) => b.favoritesId.length - a.favoritesId.length);
  }
  getMostDiscussedRecipes(recipes: IRecipe[]): IRecipe[] {
    recipes = recipes.filter((recipe) => recipe.comments.length > 0);
    return recipes.sort((a, b) => b.comments.length - a.comments.length);
  }
  getPlannedRecipes(recipes: IRecipe[], plan: IPlan) {
    const plannedRecipeIds: number[] = [];

    for (const calendarEvent of plan.calendarEvents) {
      plannedRecipeIds.push(calendarEvent.recipe);
    }

    const plannedRecipes: IRecipe[] = [];

    recipes.forEach((element) => {
      if (plannedRecipeIds.includes(element.id)) plannedRecipes.push(element);
    });

    return plannedRecipes;
  }
  getPublicRecipes(recipes: IRecipe[]) {
    return recipes.filter((recipe) => recipe.status === 'public');
  }
  getPublicAndAllMyRecipes(recipes: IRecipe[], userId: number) {
    return recipes.filter(
      (recipe) => recipe.status === 'public' || recipe.authorId === userId,
    );
  }
  getAwaitingRecipes(recipes: IRecipe[]) {
    return recipes.filter((recipe) => recipe.status === 'awaits');
  }
  getNotPrivateRecipes(recipes: IRecipe[]) {
    return recipes.filter((recipe) => recipe.status !== 'private');
  }
  getRecentRecipes(recipes: IRecipe[]) {
    return recipes.sort((a, b) => {
      const date1 = new Date(a.publicationDate);
      const date2 = new Date(b.publicationDate);

      if (date1 > date2) {
        return -1; // Если дата публикации первого рецепта позже, он будет первым в отсортированном массиве.
      } else if (date1 < date2) {
        return 1; // Если дата публикации второго рецепта позже, он будет первым в отсортированном массиве.
      } else {
        return 0; // Если даты равны, порядок не важен.
      }
    });
  }

  getRecipesByIngredient(
    recipes: IRecipe[],
    ingredient: IIngredient,
  ): IRecipe[] {
    const recipesWithIngredient: IRecipe[] = [];
    const ingredientName = ingredient.name.toLowerCase().trim();
    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((rIngredient) => {
        const formattedRecipeIngredientName = rIngredient.name
          .toLowerCase()
          .trim();
        const variationsMatch =
          ingredient.variations.length > 0 &&
          ingredient.variations.some((variation) => {
            const formattedVariation = variation.toLowerCase().trim();
            return (
              formattedRecipeIngredientName.includes(formattedVariation) ||
              formattedVariation.includes(formattedRecipeIngredientName)
            );
          });

        if (
          formattedRecipeIngredientName.includes(ingredientName) ||
          variationsMatch
        ) {
          recipesWithIngredient.push(recipe);
        }
      });
    });
    const uniqueRecipesWithIngredient = recipesWithIngredient.filter(
      (recipe, index, self) =>
        index === self.findIndex((r) => r.id === recipe.id),
    );
    return uniqueRecipesWithIngredient;
  }
  getRecipesByCategory(recipes: IRecipe[], categoryId: number) {
    return recipes.filter((recipe) => recipe.categories.includes(categoryId));
  }
  getRecipesByUser(recipes: IRecipe[], userId: number): IRecipe[] {
    return recipes.filter((recipe) => recipe.authorId === userId);
  }

  addRecipeToFavorites(userId: number, recipe: IRecipe): IRecipe {
    if (!recipe.favoritesId.includes(userId)) {
      recipe.favoritesId.push(userId);
    }
    return recipe;
  }

  hideAuthor(currentUser: IUser, author: IUser): boolean {
    return (
      currentUser.id === author.id ||
      (author.role !== 'admin' && currentUser.role !== 'user') ||
      this.userService.getPermission('hide-author', author)
    );
  }
  removeRecipeFromFavorites(userId: number, recipe: IRecipe): IRecipe {
    if (recipe.favoritesId.includes(userId)) {
      recipe.favoritesId = recipe.favoritesId.filter(
        (favorite) => favorite !== userId,
      );
    }

    return recipe;
  }

  likeRecipe(userId: number, recipe: IRecipe): IRecipe {
    if (!recipe.likesId.includes(userId)) {
      recipe.likesId.push(userId);
    }
    return recipe;
  }
  unlikeRecipe(userId: number, recipe: IRecipe): IRecipe {
    if (recipe.likesId.includes(userId)) {
      recipe.likesId = recipe.likesId.filter((liked) => liked !== userId);
    }
    return recipe;
  }

  cookRecipe(userId: number, recipe: IRecipe): IRecipe {
    if (!recipe.cooksId.includes(userId)) {
      recipe.cooksId.push(userId);
    }
    return recipe;
  }
  uncookRecipe(userId: number, recipe: IRecipe): IRecipe {
    if (recipe.cooksId.includes(userId)) {
      recipe.cooksId = recipe.cooksId.filter((cooked) => cooked !== userId);
    }
    return recipe;
  }
}
