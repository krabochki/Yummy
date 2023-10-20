import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe } from '../models/recipes';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private recipesSubject = new BehaviorSubject<IRecipe[]>([]);
  recipes$ = this.recipesSubject.asObservable();

  url: string = 'http://localhost:3000/recipes';

  constructor(private http: HttpClient) {
    this.getRecipes().subscribe((data) => {
      this.recipesSubject.next(data);
    });
  }

  deleteDataAboutDeletingUser(authorId: number) {
    let recipes: IRecipe[] = [];
    this.getRecipes().subscribe((data) => {
      recipes = data;

      recipes.forEach((recipe) => {
        if (recipe.authorId === authorId) {
          this.deleteRecipe(recipe.id).subscribe();
        } else {
          const before = recipe;
          if (recipe.likesId)
            recipe.likesId = recipe.likesId.filter(
              (element) => element !== authorId,
            );
          if (recipe.cooksId)
            recipe.cooksId = recipe.cooksId.filter(
              (element) => element !== authorId,
            );
          if (recipe.comments)
            recipe.comments = recipe.comments.filter(
              (element) => element.id !== authorId,
            );
          if (before !== recipe) {
            this.updateRecipe(recipe);
          }
        }
      });
    });
  }

  getRecipes() {
    return this.http.get<IRecipe[]>(this.url);
  }

  getRecipe(id: number) {
    return this.http.get<IRecipe>(`${this.url}/${id}`);
  }

  deleteRecipe(id: number) {
    return this.http.delete<IRecipe>(`${this.url}/${id}`);
  }

  postRecipe(recipe: IRecipe) {
    return this.http.post<IRecipe>(this.url, recipe);
  }

  updateRecipe(recipe: IRecipe) {
    const url = `${this.url}/${recipe.id}`;

    return this.http.put<IRecipe>(url, recipe).subscribe((updatedRecipe) => {
      const currentRecipes = this.recipesSubject.value;

      const index = currentRecipes.findIndex((r) => r.id === updatedRecipe.id);

      if (index !== -1) {
        const updatedRecipes = [...currentRecipes];
        updatedRecipes[index] = updatedRecipe;
        this.recipesSubject.next(updatedRecipes);
      }
    });
  }

  getFavoriteRecipesByUser(recipes: IRecipe[], user: number) {
    return (recipes.filter((recipe) => recipe.favoritesId.includes(user)))
  }
  getPopularRecipes(recipes: IRecipe[]) {
    return recipes.sort((a, b) => b.likesId.length - a.likesId.length);
  }
  getPublicRecipes(recipes: IRecipe[]) {
    return recipes.filter((recipe) => recipe.status === 'public');
  }
  getAwaitingRecipes(recipes: IRecipe[]) {
    return recipes.filter((recipe) => recipe.status === 'awaits');
  }
  getNotPrivateRecipes(recipes: IRecipe[]) {
    return recipes.filter((recipe) => recipe.status !== 'private');
  }
  getRecentRecipes(recipes: IRecipe[]) {
    return recipes.sort((a, b) => {
      const dateA = new Date(a.publicationDate);
      const dateB = new Date(b.publicationDate);
      return dateB.getTime() - dateA.getTime();
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
