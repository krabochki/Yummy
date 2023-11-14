import { Injectable } from '@angular/core';
import { ICategory, ISection, nullSection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { ingredientsGroupsUrl, ingredientsUrl } from 'src/tools/source';
import { IRecipe } from '../models/recipes';
import { IIngredient, IIngredientsGroup, nullIngredient, nullIngredientsGroup } from '../models/ingredients';
import { RecipeService } from './recipe.service';
import { baseComparator } from 'src/tools/common';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  urlIngredients: string = ingredientsUrl;
  urlIngredientsGroups: string = ingredientsGroupsUrl;

  ingredientSubject = new BehaviorSubject<IIngredient[]>([]);
  ingredients$ = this.ingredientSubject.asObservable();

  ingredientGroupsSubject = new BehaviorSubject<IIngredientsGroup[]>([]);
  ingredientsGroups$ = this.ingredientGroupsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
  ) {}

  loadIngredientsGroupsData() {
    this.getIngredientGroups().subscribe((data) => {
      this.ingredientGroupsSubject.next(data);
    });
  }

  loadIngredientsData() {
    this.getIngredients().subscribe((data) => {
      this.ingredientSubject.next(data);
    });
  }

  updateIngredientGroup(group: IIngredientsGroup) {
    return this.http
      .put<IIngredientsGroup>(`${this.urlIngredientsGroups}/${group.id}`, group)
      .pipe(
        tap((updatedGroup: IIngredientsGroup) => {
          const currentGroups = this.ingredientGroupsSubject.value;
          const index = currentGroups.findIndex(
            (r) => r.id === updatedGroup.id,
          );
          if (index !== -1) {
            const updatedGroups = [...currentGroups];
            updatedGroups[index] = updatedGroup;

            this.ingredientGroupsSubject.next(updatedGroups);
          }
        }),
      );
  }

  updateIngredient(ingredient: IIngredient) {
    return this.http
      .put<IIngredient>(
        `${this.urlIngredients}/${ingredient.id}`,
        ingredient,
      )
      .pipe(
        tap((updatedIngedient: IIngredient) => {
          const currentIngredients = this.ingredientSubject.value;
          const index = currentIngredients.findIndex(
            (r) => r.id === updatedIngedient.id,
          );
          if (index !== -1) {
            const updatedIngredients = [...currentIngredients];
            updatedIngredients[index] = updatedIngedient;

            this.ingredientSubject.next(updatedIngredients);
          }
        }),
      );
  }

  getIngredientGroups() {
    return this.http.get<IIngredientsGroup[]>(this.urlIngredientsGroups);
  }

  getIngredients() {
    return this.http.get<IIngredient[]>(this.urlIngredients);
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

  deleteGroup(id: number) {
    return this.http
      .delete<IIngredientsGroup>(`${this.urlIngredientsGroups}/${id}`)
      .pipe(
        tap(() =>
          this.ingredientGroupsSubject.next(
            this.ingredientGroupsSubject.value.filter(
              (group) => group.id !== id,
            ),
          ),
        ),
        catchError((error) => {
          return throwError(error);
        }),
      );
  }

  deleteIngredient(id: number) {
    return this.http.delete<IIngredient>(`${this.urlIngredients}/${id}`).pipe(
      tap(() =>
        this.ingredientSubject.next(
          this.ingredientSubject.value.filter((ing) => ing.id !== id),
        ),
      ),
      catchError((error) => {
        return throwError(error);
      }),
    );
  }

  getRecipesNumberOfGroup(group:IIngredientsGroup,ingredients:IIngredient[],recipes:IRecipe[]) {
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

  postGroup(group: IIngredientsGroup) {
    return this.http
      .post<IIngredientsGroup>(this.urlIngredientsGroups, group)
      .pipe(
        tap((newGroup: IIngredientsGroup) => {
          const currentGroups = this.ingredientGroupsSubject.value;
          const updatedGroups = [...currentGroups, newGroup];
          this.ingredientGroupsSubject.next(updatedGroups);
        }),
      );
  }

  postIngredient(ingredient: IIngredient) {
    return this.http.post<IIngredient>(this.urlIngredients, ingredient).pipe(
      tap((newIngredient: IIngredient) => {
        const currentIngredients = this.ingredientSubject.value;
        const updatedIngedients = [...currentIngredients, newIngredient];
        this.ingredientSubject.next(updatedIngedients);
      }),
    );
  }

  findIngredientByName(name: string,ingredients:IIngredient[]): IIngredient {
    const findedIngredients: IIngredient[] = [];
    const ingredientName = name.toLowerCase().trim();
    ingredients.forEach((ingredient) => {
      const variationsMatch =
        ingredient.variations.length > 0 &&
        ingredient.variations.some((variation) => {
          const formattedVariation = variation.toLowerCase().trim();
          return (
            ingredientName.includes(formattedVariation) ||
            formattedVariation.includes(ingredientName)
          );
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
}
