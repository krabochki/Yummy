import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe } from '../models/recipes';
import { switchMap, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  url: string = 'http://localhost:3000/recipes';

  constructor(private http: HttpClient) {}

  deleteDataAboutDeletingUser(authorId: number) {
    let recipes: IRecipe[] = [];
    this.getRecipes().subscribe((data) => {
      recipes = data;

      recipes.forEach((recipe) => {
        if (recipe.authorId == authorId) {
          this.deleteRecipe(recipe.id).subscribe();
        } else {
          const before = recipe;
          if(recipe.likesId)
          recipe.likesId = recipe.likesId.filter(
            (element) => element !== authorId,
          );
          if(recipe.cooksId)
          recipe.cooksId = recipe.cooksId.filter(
            (element) => element !== authorId,
          );
          if(recipe.comments)
          recipe.comments = recipe.comments.filter(
            (element) => element.id !== authorId,
          );
          if (before !== recipe) {
            this.updateRecipe(recipe).subscribe();
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
    return this.http.put<IRecipe>(`${this.url}/${recipe.id}`, recipe);
  }

  getPopularRecipes(recipes: IRecipe[]) {
    return recipes.sort((a, b) => b.likesId.length - a.likesId.length);
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
    return recipes.filter((recipe) => recipe.authorId == userId);
  }
}
