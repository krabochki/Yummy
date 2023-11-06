import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe, IRecipeStatistics } from '../models/recipes';
import { BehaviorSubject, catchError, map, mergeMap, switchMap, take, tap, throwError } from 'rxjs';
import { recipesUrl } from 'src/tools/source';
import { getCurrentDate } from 'src/tools/common';
import { IPlan } from '../../planning/models/plan';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  recipesSubject = new BehaviorSubject<IRecipe[]>([]);
  recipes$ = this.recipesSubject.asObservable();

  url: string = recipesUrl;

  constructor(private http: HttpClient) {}

  loadRecipeData() {
    this.getRecipes().subscribe((data) => {
      this.recipesSubject.next(data);
    });
  }

  deleteDataAboutDeletingUser(deletableId: number) {
    let recipes: IRecipe[] = [];
    this.recipes$.subscribe((data) => {
      recipes = data;

      recipes.forEach((recipe) => {
        if (recipe.authorId === deletableId) {
          this.deleteRecipe(recipe.id);
        } else {
          const before = { ...recipe };

          if (recipe.likesId.includes(deletableId)) {
            recipe.likesId = recipe.likesId.filter(
              (element) => element !== deletableId,
            );
          }
          if (recipe.favoritesId.includes(deletableId)) {
            recipe.favoritesId = recipe.favoritesId.filter(
              (element) => element !== deletableId,
            );
          }
          if (recipe.cooksId.includes(deletableId)) {
            recipe.cooksId = recipe.cooksId.filter(
              (element) => element !== deletableId,
            );
          }
          if (recipe.comments)
            recipe.comments = recipe.comments.filter(
              (element) => element.id !== deletableId,
            );
          if (
            before.likesId !== recipe.likesId ||
            before.cooksId !== recipe.cooksId ||
            before.favoritesId !== recipe.favoritesId
          ) {
            this.updateRecipe(recipe);
          }
        }
      });
    });
  }

  getRecipes() {
    return this.http.get<IRecipe[]>(this.url);
  }

  deleteRecipe(id: number) {
    return this.http.delete(`${this.url}/${id}`).pipe(
      tap(() =>
        this.recipesSubject.next(
          this.recipesSubject.value.filter((recipe) => recipe.id !== id),
        ),
      ),
      catchError((error) => {
        return throwError(error);
      }),
    );
  }

  postRecipe(recipe: IRecipe) {
    return this.http.post<IRecipe>(this.url, recipe).pipe(
      tap((newRecipe: IRecipe) => {
        const currentRecipes = this.recipesSubject.value;
        const updatedRecipes = [...currentRecipes, newRecipe];
        this.recipesSubject.next(updatedRecipes);
      }),
    );
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

  updateRecipe(recipe: IRecipe) {
    return this.http.put<IRecipe>(`${this.url}/${recipe.id}`, recipe).pipe(
      tap((updatedRecipe: IRecipe) => {
        const currentRecipes = this.recipesSubject.value;
        const index = currentRecipes.findIndex(
          (r) => r.id === updatedRecipe.id,
        );
        if (index !== -1) {
          const updatedRecipes = [...currentRecipes];
          updatedRecipes[index] = updatedRecipe;

          this.recipesSubject.next(updatedRecipes);
        }
      }),
    );
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
      userId: userId,
      answer: userChoice,
    };
    if (!recipe.statistics) recipe.statistics = [];
    recipe.statistics.push(statistic);
    return recipe;
  }
  removeVote(recipe: IRecipe, userId: number): IRecipe {
    if (!recipe.statistics) recipe.statistics = [];

    recipe.statistics = recipe.statistics.filter(
      (stat) => stat.userId !== userId,
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
    console.log(plannedRecipeIds);

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
