import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { matchSource } from 'src/tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  url = matchSource;

  constructor(private http: HttpClient) {}

  getIngredients(userId: number, limit?: number) {
    const url =
      `${this.url}/ingredients/${userId}` + (limit ? `?limit=${limit}` : '');
    return this.http.get<{ name: string; count: number }[]>(url);
  }

  getIngredientsBySearch(searchText: string, userId: number) {
    const url = `${this.url}/search-ingredients/${userId}?search=${searchText}`;
    return this.http.get(url);
  }

  getRecipes(
    includedIngredients: string[],
    excludedIngredients: string[],
    userId: number,
  ) {
    const includedIngredientsString = includedIngredients.join(',');
    const excludedIngredientsString = excludedIngredients.join(',');
    const params = new HttpParams().set('includedIngredients', includedIngredientsString);
    params.set('excludedIngredients', excludedIngredientsString);
    return this.http.get(`${this.url}/recipes/${userId}`, { params: params });
  }
}
