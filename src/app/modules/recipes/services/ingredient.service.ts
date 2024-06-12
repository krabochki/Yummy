import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IIngredient, IGroup } from '../models/ingredients';
import { ingredientsSource } from 'src/tools/sourses';
import { ICategory } from '../models/categories';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  ingredientsUrl = ingredientsSource;

  constructor(private http: HttpClient) {}

  getIngredient(id: number): Observable<IIngredient> {
    const options = { withCredentials: true };

    return this.http.get<IIngredient>(
      this.ingredientsUrl + '/ingredient/' + id,
      options,
    );
  }

  getInfoAboutIngredientInShoppingList(ingredientId: number) {
    const options = { withCredentials: true };

    return this.http.get(
      `${this.ingredientsUrl}/products/${ingredientId}`,
      options,
    );
  }

  getAwaitingIngredientsCount() {
    const options = { withCredentials: true };

    const url = `${this.ingredientsUrl}/awaits-count`;
    return this.http.get<number>(url, options);
  }

  getVariations(id: number) {
    const options = { withCredentials: true };

    return this.http.get<string[]>(
      this.ingredientsUrl + '/variations/' + id,
      options,
    );
  }

  getRelatedCategories(id: number) {
    const options = { withCredentials: true };

    return this.http.get<ICategory[]>(
      this.ingredientsUrl + '/related-categories/' + id,
      options,
    );
  }

  getRelatedIngredients(id: number) {
    const options = { withCredentials: true };

    return this.http.get<IIngredient[]>(
      this.ingredientsUrl + '/related-ingredients/' + id,
      options,
    );
  }

  getFullIngredient(ingredientId: number): Observable<IIngredient> {
    const options = { withCredentials: true };

    return this.http.get<IIngredient>(
      `${this.ingredientsUrl}/full-ingredient/${ingredientId}`,
      options,
    );
  }

  getIngredientForEditing(ingredientId: number): Observable<IIngredient> {
    const options = { withCredentials: true };

    return this.http.get<IIngredient>(
      `${this.ingredientsUrl}/edit-ingredient/${ingredientId}`,
      options,
    );
  }

  getGroupsOfIngredient(id: number) {
    const options = { withCredentials: true };

    return this.http.get<IGroup[]>(
      `${this.ingredientsUrl}/groups/${id}`,
      options,
    );
  }

  setGroupToIngredient(sectionId: number, ingredientId: number) {
    const options = { withCredentials: true };

    const url = `${this.ingredientsUrl}/set-group/${ingredientId}`;
    return this.http.put(url, { id: sectionId }, options);
  }

  getIngredientsOfGroup(groupId: number) {
    const options = { withCredentials: true };

    const url = `${this.ingredientsUrl}/by-group/${groupId}`;
    return this.http.get<IIngredient[]>(url, options);
  }

  approveIngredient(ingredientId: number) {
    const options = {
      withCredentials: true,
    };

    return this.http.put(
      `${this.ingredientsUrl}/approve/${ingredientId}`,
      {},
      options,
    );
  }

  getSomeAwaitingIngredients(limit: number, page: number) {
    const options = {
      withCredentials: true,
    };

    const url = `${this.ingredientsUrl}/awaiting?limit=${limit}&page=${page}`;
    return this.http.get<{ ingredients: IIngredient[]; count: number }>(
      url,
      options,
    );
  }

  updateIngredient(updatedIngredient: IIngredient) {
    const options = {
      withCredentials: true,
    };
    return this.http.put(
      `${this.ingredientsUrl}/${updatedIngredient.id}`,
      updatedIngredient,
      options,
    );
  }
  setImageToIngredient(id: number, filename: string) {
    const options = {
      withCredentials: true,
    };
    return this.http.put(
      `${this.ingredientsUrl}/image/${id}`,
      {
        image: filename,
      },
      options,
    );
  }

  uploadIngredientImage(file: File) {
    const options = {
      withCredentials: true,
    };

    const formData: FormData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(`${this.ingredientsUrl}/image`, formData, options);
  }

  getStatus(ingredientId: number) {
    const options = { withCredentials: true };

    const url = `${this.ingredientsUrl}/isAwaits/${ingredientId}`;
    return this.http.get(url, options);
  }

  deleteIngredient(ingredientId: number) {
    const options = {
      withCredentials: true,
    };
    return this.http.delete(`${this.ingredientsUrl}/${ingredientId}`, options);
  }

  deleteProductsByIngredientName(ingredientId: number) {
    const options = {
      withCredentials: true,
    };
    return this.http.delete(
      `${this.ingredientsUrl}/products/${ingredientId}`,
      options,
    );
  }

  getIngredientsBySearch(searchText: string) {
    const url = `${this.ingredientsUrl}/search/?search=${searchText}`;
    return this.http.get<IIngredient[]>(url);
  }

  getSomePopularIngredients(limit: number, page: number) {
    const options = {
      withCredentials: true,
    };
    const url = `${this.ingredientsUrl}/some-popular?limit=${limit}&page=${page}`;

    return this.http.get<IIngredient[]>(url, options);
  }

  getPopularIngredients() {
    const options = {
      withCredentials: true,
    };
    const url = `${this.ingredientsUrl}/popular`;
    return this.http.get<IIngredient[]>(url, options);
  }

  deleteImage(ingredientId: number) {
    const options = {
      withCredentials: true,
    };

    const url = `${this.ingredientsUrl}/files/${ingredientId}`;
    return this.http.delete(url, options);
  }

  deleteAllGroups(ingredientId: number) {
    const options = {
      withCredentials: true,
    };
    const url = `${this.ingredientsUrl}/groups/${ingredientId}`;
    return this.http.delete(url, options);
  }

  deleteAllVariations(ingredientId: number) {
    const options = {
      withCredentials: true,
    };
    const url = `${this.ingredientsUrl}/variations/${ingredientId}`;
    return this.http.delete(url, options);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.ingredientsUrl}/files/${filename}`;
    const options = {
      responseType: 'blob' as 'blob',
      withCredentials: true,
    };

    return this.http.get(fileUrl, options);
  }

  postVariation(ingredientId: number, variation: string) {
    const options = {
      withCredentials: true,
    };
    const url = `${this.ingredientsUrl}/variation/${ingredientId}`;
    return this.http.post(
      url,
      {
        variation: variation,
      },
      options,
    );
  }

  postIngredient(newIngredient: IIngredient) {
    const options = {
      withCredentials: true,
    };

    const url = `${this.ingredientsUrl}`;
    return this.http.post(url, newIngredient, options);
  }
}
