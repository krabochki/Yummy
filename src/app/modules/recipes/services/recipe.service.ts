import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe, IRecipeStatistics, Instruction } from '../models/recipes';
import {
  Observable,
} from 'rxjs';
import { recipesSource } from 'src/tools/sourses';
@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  constructor(private http: HttpClient) { }
  
  

  getRecipeForEditing(recipeId: number): Observable<IRecipe> {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/edit-recipe/${recipeId}`;
    return this.http.get<IRecipe>(url, options);
  }

  getPublicRecipesBySearch(searchText: string): Observable<any> {
    const url = `${this.recipesUrl}/search/public?search=${searchText}`;
    return this.http.get(url);
  }

  getMyRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/search/my?search=${searchText}`;
    return this.http.get(url, options);
  }

  getFavoriteRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/search/favorite?search=${searchText}`;
    return this.http.get(url, options);
  }

  getLikedRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/search/liked?search=${searchText}`;
    return this.http.get(url, options);
  }

  getRecipesOfCategoryBySearch(
    searchText: string,
    categoryId: number,
  ): Observable<any> {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/search/by-category/${categoryId}?search=${searchText}`;
    return this.http.get(url, options);
  }

  getCookedRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/search/cooked?search=${searchText}`;
    return this.http.get(url, options);
  }
  getFollowingRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/search/following?search=${searchText}`;
    return this.http.get(url, options);
  }

   approveMyRecipe(recipeId: number) {
    const options = { withCredentials: true };
    return this.http.put(`${this.recipesUrl}/approve-myself/${recipeId}`, {}, options);
  }
  approveRecipe(recipeId: number) {
    const options = { withCredentials: true };
    return this.http.put(`${this.recipesUrl}/approve/${recipeId}`, {}, options);
  }
  makeRecipeAwaits(recipeId: number) {
    const options = { withCredentials: true };
    return this.http.put(
      `${this.recipesUrl}/make-awaits/${recipeId}`,
      {},
      options,
    );
  }
  dismissRecipe(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.put(`${this.recipesUrl}/dismiss/${recipeId}`, {}, options);
  }

  getPublicAndMyRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/search/public-and-my?search=${searchText}`;
    return this.http.get(url, options);
  }

  getDiscussedRecipesBySearch(searchText: string): Observable<any> {
    const url = `${this.recipesUrl}/search/discussed?search=${searchText}`;
    return this.http.get(url);
  }

  getCommentedRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/search/commented?search=${searchText}`;
    return this.http.get(url, options);
  }
  getRecipesByIngredientBySearch(
    searchText: string,
    ingredientId: number,
  ): Observable<any> {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/search/by-ingredient/${ingredientId}?search=${searchText}`;
    return this.http.get(url, options);
  }
  getPlannedRecipesBySearch(searchText: string): Observable<any> {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/search/planned?search=${searchText}`;
    return this.http.get(url, options);
  }

  recipesUrl = recipesSource;

  setCategoryToRecipe(categoryId: number, recipeId: number) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/set-category/${recipeId}`;
    return this.http.put(url, { id: categoryId }, options);
  }

  postIngredientToRecipe(
    recipeId: number,
    quantity: string,
    name: string,
    unit: string,
  ) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/ingredient/${recipeId}`;
    return this.http.post(
      url,
      { name: name, quantity: quantity, unit: unit },
      options,
    );
  }

  postRecipe(recipe: IRecipe) {
    const options = { withCredentials: true };
    return this.http.post(this.recipesUrl, recipe, options);
  }

  getAwaitingRecipesCount() {
    const options = { withCredentials: true };

    return this.http.get(`${this.recipesUrl}/awaits-count`, options);
  }

  voteForRecipe(recipe: IRecipe, userChoice: boolean): IRecipe {
    const stat = recipe.statistics;

    if (stat) {
      stat.userVote = userChoice;
      if (userChoice) {
        stat.positive++;
      } else {
        stat.negative++;
      }
    }
    return recipe;
  }

  removeVote(recipe: IRecipe): IRecipe {
    const stat = recipe.statistics;
    if (stat) {
      if (stat.userVote === false) {
        stat.negative--;
      }
      if (stat.userVote === true) {
        stat.positive--;
      }
      stat.userVote = null;
    }
    return recipe;
  }

  addRecipeToFavorites(recipe: IRecipe): IRecipe {
    recipe.faved = true;

    return recipe;
  }

  removeRecipeFromFavorites(recipe: IRecipe): IRecipe {
    if (recipe.faved) {
      recipe.faved = false;
    }

    return recipe;
  }

  cookRecipe(recipe: IRecipe): IRecipe {
    recipe.cooksLength++;
    recipe.cooked = true;

    return recipe;
  }
  uncookRecipe(recipe: IRecipe): IRecipe {
    recipe.cooked = false;
    recipe.cooksLength--;

    return recipe;
  }

  setRecipeImage(recipeId: number, filename: string) {
    const options = { withCredentials: true };

    return this.http.put(
      `${this.recipesUrl}/image/${recipeId}`,
      {
        image: filename,
      },
      options,
    );
  }

  getRecipe(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.get<IRecipe>(
      `${this.recipesUrl}/recipe/${recipeId}`,
      options,
    );
  }

  deleteRecipe(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.delete<IRecipe>(`${this.recipesUrl}/${recipeId}`, options);
  }

  getIngredients(recipeId: number) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/ingredients/${recipeId}`;
    return this.http.get(url, options);
  }
  getInstructions(recipeId: number) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/instructions/${recipeId}`;
    return this.http.get<Instruction[]>(url, options);
  }
  getInstructionsImages(recipeId: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/instructions-images/${recipeId}`;
    return this.http.get<{ instructionId: number; image: string }[]>(
      url,
      options,
    );
  }
  getInstructionImages(instructionId: number) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/instruction-images/${instructionId}`;
    return this.http.get<string[]>(url, options);
  }

 
  postInstruction(recipeId: number, instruction: string) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/instruction/${recipeId}`;
    return this.http.post(
      url,
      {
        instruction: instruction,
      },
      options,
    );
  }
  postInstructionImage(instructionId: number, filename: string) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/instruction-image/${instructionId}`;
    return this.http.post(
      url,
      {
        filename: filename,
      },
      options,
    );
  }

  uploadInstructionImage(file: File) {
    const options = { withCredentials: true };
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(
      `${this.recipesUrl}/instruction-image`,
      formData,
      options,
    );
  }

  deleteAllIngredients(recipeId: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/ingredients/${recipeId}`;
    return this.http.delete(url, options);
  }

  deleteAllInstructions(recipeId: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/instructions/${recipeId}`;
    return this.http.delete(url, options);
  }

  deleteAllCategories(recipeId: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/categories/${recipeId}`;
    return this.http.delete(url, options);
  }

  getAllNotPublicRecipesImages(userId: number, token: string) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/notPublicImages/${userId}/${token}`;
    return this.http.get(url, options);
  }
  getRelatedIngredients(recipeId: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/related-ingredients/${recipeId}`;
    return this.http.get<{ name: string; id: number; groupId: number }[]>(
      url,
      options,
    );
  }

  deleteRecipeImage(recipeId: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/files/${recipeId}`;
    return this.http.delete(url, options);
  }

  deleteInstructionsImages(recipeId: number) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/instructions-files/${recipeId}`;
    return this.http.delete(url, options);
  }

  getSomePublicRecipesByUser(
    limit: number,
    page: number,
    userId: number,
    recipeId: number,
  ) {
    const url = `${this.recipesUrl}/public-by-user/${userId}/${recipeId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeRecipesByUser(limit: number, page: number) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/by-user?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomePopularRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/popular?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeAwaitingRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/awaiting?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }
  getMostCommentedRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/most-commented?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeRecipesByIngredient(
    limit: number,
    page: number,
    ingredientId: number,
  ) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/by-ingredient/${ingredientId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeRecipesByCategory(limit: number, page: number, categoryId: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/by-category/${categoryId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  downloadRecipeImage(filename: string) {
    const options = {
      responseType: 'blob' as 'blob',
      withCredentials: true,
    };

    const fileUrl = `${this.recipesUrl}/recipe-files/${filename}`;
    return this.http.get(fileUrl, options);
  }

  downloadInstructionImage(filename: string) {
    const options = {
      responseType: 'blob' as 'blob',
      withCredentials: true,
    };

    const fileUrl = `${this.recipesUrl}/instruction-files/${filename}`;
    return this.http.get(fileUrl, options);
  }

  uploadRecipeImage(file: File) {
    
    const options = { withCredentials: true };

    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(`${this.recipesUrl}/recipe-image`, formData, options);
  }

  getSomeUserFavoriteRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/user-favorites?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeUserPlannedRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/user-planned?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeUserFollowedRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/followed?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeUserCommentedRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/user-comments?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }
  getSomeUserLikedRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/user-liked?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }
  getSomeUserCookedRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/user-cooked?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeMostCookedRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/most-cooked?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeMostFavoriteRecipes(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/most-favorite?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeRecipesForUserpage(limit: number, page: number, authorId: number) {
    const options = { withCredentials: true };
    const url = `${this.recipesUrl}/userpage/${authorId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getSomeMostRecentRecipes(
    limit: number,
    page: number,
    except?: number,
    authorId?: number,
  ) {
    const options = { withCredentials: true };

    const url =
      `${this.recipesUrl}/most-recent?limit=${limit}&page=${page}` +
      (except ? `&except=${except}&authorId=${authorId}` : '');
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }
  getSomeSimilarRecipes(
    limit: number,
    page: number,
    recipeId: number,
    authorId: number,
  ) {
    const options = { withCredentials: true };

    const url = `${this.recipesUrl}/similar/${recipeId}?limit=${limit}&page=${page}&authorId=${authorId}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url, options);
  }

  getLikes(recipeId: number) {
    return this.http.get<{ likesIds: number[] }>(
      `${this.recipesUrl}/likes/${recipeId}`,
    );
  }

  getVotes(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.get<IRecipeStatistics>(
      `${this.recipesUrl}/votes/${recipeId}`,
      options,
    );
  }

  getCategories(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.get<{ categoriesIds: number[] }>(
      `${this.recipesUrl}/categories/${recipeId}`,
      options,
    );
  }

  getCooks(recipeId: number) {
    return this.http.get<{ cooksIds: number[] }>(
      `${this.recipesUrl}/cooks/${recipeId}`,
    );
  }

  pushToFavorites(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.post(
      `${this.recipesUrl}/favorites/${recipeId}`,
      {},
      options,
    );
  }

  removeFromFavorites(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.delete(
      `${this.recipesUrl}/favorites/${recipeId}`,
      options,
    );
  }

  translateStatistics(statistics: any) {
    statistics.userVote = statistics.userVote == 'true' ? true : false;
    return statistics;
  }
  setLike(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.post(`${this.recipesUrl}/likes/${recipeId}`, {}, options);
  }

  unsetLike(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.delete(`${this.recipesUrl}/likes/${recipeId}`, options);
  }

  translateRecipe(recipe: any): IRecipe {
    return {
      ...recipe,
      publicationDate: recipe.sendDate || '',
      instructions: recipe.instructions || [],
      ingredients: recipe.ingredients || [],
      reports: recipe.reports || [],
      comments: recipe.comments || [],
      nutritions: recipe.nutritions || [],
      categories: recipe.categories || [],
      likesId: recipe.likesId || [],
      cooksId: recipe.cooksId || [],
      favoritesId: recipe.favoritesId || [],
      statistics: recipe.statistics || [],
    };
  }

  setCook(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.post(`${this.recipesUrl}/cooks/${recipeId}`, {}, options);
  }

  unsetCook(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.delete(`${this.recipesUrl}/cooks/${recipeId}`, options);
  }

  removeVoteForRecipe(recipeId: number) {
    const options = { withCredentials: true };

    return this.http.delete(`${this.recipesUrl}/votes/${recipeId}`, options);
  }

  pushVoteForRecipe(recipeId: number, vote: boolean) {
    const options = { withCredentials: true };

    return this.http.post(
      `${this.recipesUrl}/votes/${recipeId}/${vote ? 1 : 0}`,
      {},
      options,
    );
  }

  getMostShortedRecipe(id: number) {
    const options = { withCredentials: true };

    return this.http.get<IRecipe>(
      `${this.recipesUrl}/most-shorted-recipe/${id}`,
      options,
    );
  }

  likeRecipe(recipe: IRecipe): IRecipe {
    recipe.liked = true;
    recipe.likesLength = recipe.likesLength + 1;

    return recipe;
  }
  unlikeRecipe(recipe: IRecipe): IRecipe {
    recipe.liked = false;
    recipe.likesLength = recipe.likesLength - 1;

    return recipe;
  }

  getFavorites(recipeId: number) {
    return this.http.get<{ favoritesIds: number[] }>(
      `${this.recipesUrl}/favorites/${recipeId}`,
    );
  }

  updateRecipe(recipe: IRecipe) {
    const options = { withCredentials: true };

    return this.http.put(`${this.recipesUrl}/${recipe.id}`, recipe, options);
  }
}
