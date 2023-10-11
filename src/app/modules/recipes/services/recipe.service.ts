import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe } from '../models/recipes';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  url: string = 'http://localhost:3000/recipes';

  constructor(private http: HttpClient) {}

  getRecipes() {
    return this.http.get<IRecipe[]>(this.url);
  }

  getRecipe(id: number) {
    return this.http.get<IRecipe>(`${this.url}/${id}`);
  }

  deleteRecipe(id: number) {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  postRecipe(recipe: IRecipe) {
    return this.http.post<IRecipe>(this.url, recipe);
  }

  updateProduct(recipe: IRecipe) {
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
