import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  forkJoin,
  of,
  tap,
} from 'rxjs';
import { IRecipe } from '../models/recipes';
import { IIngredient, IGroup, nullIngredient } from '../models/ingredients';
import { RecipeService } from './recipe.service';
import { baseComparator } from 'src/tools/common';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { ingredientsSource } from 'src/tools/sourses';
import { ICategory } from '../models/categories';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  ingredientSubject = new BehaviorSubject<IIngredient[]>([]);
  ingredients$ = this.ingredientSubject.asObservable();
  ingredientsUrl = ingredientsSource;

  constructor(
    private recipeService: RecipeService,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getIngredient(id: number): Observable<IIngredient> {
    return this.http.get<IIngredient>(
      this.ingredientsUrl + '/ingredient/' + id,
    );
  }

  getInfoAboutIngredientInShoppingList(ingredientId: number, userId: number) {
    return this.http.get(
      `${this.ingredientsUrl}/products/${ingredientId}/${userId}`,
    );
  }

  getAwaitingIngredientsCount() {
    const url = `${this.ingredientsUrl}/awaits-count`;
    return this.http.get<number>(url);
  }

  getVariations(id: number) {
    return this.http.get<string[]>(this.ingredientsUrl + '/variations/' + id);
  }

  getRelatedCategories(id: number) {
    return this.http.get<ICategory[]>(
      this.ingredientsUrl + '/related-categories/' + id,
    );
  }

  getRelatedIngredients(id: number) {
    return this.http.get<IIngredient[]>(
      this.ingredientsUrl + '/related-ingredients/' + id,
    );
  }

  getFullIngredient(
    ingredientId: number,
    userId: number,
    role:string
  ): Observable<IIngredient> {
    return this.http.get<IIngredient>(
      `${this.ingredientsUrl}/full-ingredient/${ingredientId}/${userId}?role=${role}`,
    );
  }

  getIngredientForEditing(ingredientId: number): Observable<IIngredient> {
    return this.http.get<IIngredient>(
      `${this.ingredientsUrl}/edit-ingredient/${ingredientId}`,
    );
  }

  getAllNamesOfIngredient(ingredient: IIngredient): string[] {
    const ingridientName = ingredient.name.toLowerCase().trim();
    const variations = ingredient.variations.map((variation) =>
      variation.trim().toLowerCase(),
    );
    return [ingridientName, ...variations];
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
    // return ingredients.sort((a, b) => {
    //   if (
    //     this.recipeService.getRecipesByIngredient(recipes, b) >
    //     this.recipeService.getRecipesByIngredient(recipes, a)
    //   )
    //     return 1;
    //   else if (
    //     this.recipeService.getRecipesByIngredient(recipes, b) ===
    //     this.recipeService.getRecipesByIngredient(recipes, a)
    //   )
    //     return baseComparator(a.name, b.name);
    //   else {
    //     return -1;
    //   }
    // });
    return [];
  }

  getNotEmptyGroups(groups: IGroup[], ingredients: IIngredient[]): IGroup[] {
    const notEmptyGroups: IGroup[] = [];
    groups.forEach((group) => {
      const ingredientsOfGroup = ingredients.filter(
        (i) => i.status === 'public' && group.ingredients.includes(i.id),
      );
      if (ingredientsOfGroup.length > 0) notEmptyGroups.push(group);
    });
    return notEmptyGroups;
  }

  getGroupOfIngredient(groups: IGroup[], ingredient: IIngredient): IGroup[] {
    return (
      groups.filter(
        (group) =>
          group.ingredients.length > 0 &&
          group.ingredients.includes(ingredient.id),
      ) || []
    );
  }

  isInitialize = false;

  currentUser: IUser = { ...nullUser };

  getGroupsOfIngredient(id: number) {
    return this.http.get<IGroup[]>(`${this.ingredientsUrl}/groups/${id}`);
  }

  setIngredients(ingredients: IIngredient[]) {
    this.ingredientSubject.next(ingredients);
  }

  setGroupToIngredient(sectionId: number, ingredientId: number) {
    const url = `${this.ingredientsUrl}/set-group/${ingredientId}`;
    return this.http.put(url, { id: sectionId });
  }

  getIngredientsOfGroup(groupId: number, userId: number) {
    const url = `${this.ingredientsUrl}/by-group/${groupId}/${userId}`;
    return this.http.get<IIngredient[]>(url);
  }

  unsetGroupInIngredient(ingredientId: number, groupId: number) {
    const url = `${this.ingredientsUrl}/unset-group/${ingredientId}`;
    return this.http.put(url, { id: groupId });
  }

  updateIngredientInIngredients(ingredient: IIngredient) {
    const currentIngredients = this.ingredientSubject.value;
    const index = currentIngredients.findIndex((r) => r.id === ingredient.id);
    if (index !== -1) {
      const updatedIngredients = [...currentIngredients];
      updatedIngredients[index] = ingredient;
      this.ingredientSubject.next(updatedIngredients);
    }
  }
  setImageLoading(ingredientId: number, state: boolean) {
    const currentIngredients = this.ingredientSubject.value;
    const index = currentIngredients.findIndex((r) => r.id === ingredientId);
    if (index !== -1) {
      const updatedIngredients = [...currentIngredients];
      const newIngredient: IIngredient = {
        ...updatedIngredients[index],
        imageLoading: state,
      };
      updatedIngredients[index] = newIngredient;
      this.ingredientSubject.next(updatedIngredients);
    }
  }

  setImageURL(ingredientId: number, url: string) {
    const currentIngredients = this.ingredientSubject.value;
    const index = currentIngredients.findIndex((r) => r.id === ingredientId);
    if (index !== -1) {
      const updatedIngredients = [...currentIngredients];
      const newIngredient: IIngredient = {
        ...updatedIngredients[index],
        imageURL: url,
      };
      updatedIngredients[index] = newIngredient;
      this.ingredientSubject.next(updatedIngredients);
    }
  }

  addIngredientToIngredients(ingredient: IIngredient) {
    const currentUsers = this.ingredientSubject.value;
    const updatedIngredients = [...currentUsers, ingredient];
    this.ingredientSubject.next(updatedIngredients);
  }

  deleteIngredientFromIngredients(ingredient: IIngredient) {
    this.ingredientSubject.next(
      this.ingredientSubject.value.filter(
        (ingredients) => ingredients.id !== ingredient.id,
      ),
    );
  }

  approveIngredient(ingredientId: number, approvedId:number) {
    return this.http.put(`${this.ingredientsUrl}/approve/${ingredientId}/${approvedId}`, {});
  }

  getSomeAwaitingIngredients(limit: number, page: number) {
    const url = `${this.ingredientsUrl}/awaiting?limit=${limit}&page=${page}`;
    return this.http.get<{ ingredients: IIngredient[]; count: number }>(url);
  }
 
  updateIngredient(updatedIngredient: IIngredient, changerId:number) {
    return this.http.put(
      `${this.ingredientsUrl}/${updatedIngredient.id}/${changerId}`,
      updatedIngredient,
    );
  }
  setImageToIngredient(id: number, filename: string) {
    return this.http.put(`${this.ingredientsUrl}/image/${id}`, {
      image: filename,
    });
  }

  uploadIngredientImage(file: File) {
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(`${this.ingredientsUrl}/image`, formData);
  }

  deleteIngredient(ingredientId: number) {
    return this.http.delete(`${this.ingredientsUrl}/${ingredientId}`);
  }

  deleteProductsByIngredientName(ingredientId: number, userId: number) {
    return this.http.delete(
      `${this.ingredientsUrl}/products/${ingredientId}/${userId}`,
    );
  }

  getIngredientsBySearch(searchText: string) {
    const url = `${this.ingredientsUrl}/search/?search=${searchText}`;
    return this.http.get<IIngredient[]>(url);
  }

  getSomePopularIngredients(limit: number, page: number, userId: number) {
    const url = `${this.ingredientsUrl}/some-popular/${userId}?limit=${limit}&page=${page}`;

    return this.http.get<IIngredient[]>(url);
  }

  getPopularIngredients(userId: number) {
    const url = `${this.ingredientsUrl}/popular/${userId}`;
    return this.http.get<IIngredient[]>(url);
  }

  deleteImage(filename: string) {
    const url = `${this.ingredientsUrl}/files/${filename}`;
    return this.http.delete(url);
  }

  deleteAllVariations(ingredientId: number) {
    const url = `${this.ingredientsUrl}/variations/${ingredientId}`;
    return this.http.delete(url);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.ingredientsUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  postVariation(ingredientId: number, variation: string) {
    const url = `${this.ingredientsUrl}/variation`;
    return this.http.post(url, {
      ingredientId: ingredientId,
      variation: variation,
    });
  }

  postIngredient(newIngredient: IIngredient) {
    const url = `${this.ingredientsUrl}`;
    return this.http.post(url, newIngredient);
  }
}
