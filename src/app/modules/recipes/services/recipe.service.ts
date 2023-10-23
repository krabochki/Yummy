import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe } from '../models/recipes';
import { BehaviorSubject, catchError, map, switchMap, take, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
   recipesSubject = new BehaviorSubject<IRecipe[]>([]);
  recipes$ = this.recipesSubject.asObservable();

  url: string = 'http://localhost:3000/recipes';

  constructor(private http: HttpClient) {
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
          this.deleteRecipe(recipe.id)
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
  return this.http
    .delete(`${this.url}/${id}`)
    .pipe(
      tap((answer) =>
        this.recipesSubject.next(
          this.recipesSubject.value.filter((recipe) => recipe.id !== id),
        ),
      ),
      catchError((error) => {
        return throwError(error); 
      }),
    )
    .subscribe();
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

  updateRecipe(recipe: IRecipe) {
    const url = `${this.url}/${recipe.id}`;

    return this.http
      .put<IRecipe>(url, recipe)
      .pipe(
        switchMap((updatedRecipe) => {
          return this.recipesSubject.pipe(
            take(1), 
            map((currentRecipes) => {
              const index = currentRecipes.findIndex(
                (r) => r.id === updatedRecipe.id,
              );
              if (index !== -1) {
                const updatedUsers = [...currentRecipes];
                updatedUsers[index] = updatedRecipe;
                this.recipesSubject.next(updatedUsers); 
              }
              return updatedRecipe;
            }),
          )
        }),
        catchError((error) => {
          return throwError(error);
        }),
      )
  }

  getFavoriteRecipesByUser(recipes: IRecipe[], user: number) {
    return recipes.filter((recipe) => recipe.favoritesId.includes(user));
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
