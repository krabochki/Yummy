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
}
