import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRecipe, IRecipeStatistics, Instruction } from '../models/recipes';
import { BehaviorSubject, EMPTY, Observable, catchError, finalize, of, tap } from 'rxjs';
import { getCurrentDate } from 'src/tools/common';
import { IUser } from '../../user-pages/models/users';
import { UserService } from '../../user-pages/services/user.service';
import { IIngredient } from '../models/ingredients';
import { recipesSource } from 'src/tools/sourses';
import { CategoryService } from './category.service';
import { ICategory } from '../models/categories';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  recipesSubject = new BehaviorSubject<IRecipe[]>([]);
  recipes$ = this.recipesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService,
    private userService: UserService,
  ) {}

  getRecipeForEditing(recipeId: number): Observable<IRecipe> {
    const url = `${this.recipesUrl}/edit-recipe/${recipeId}`;
    return this.http.get<IRecipe>(url);
  }

  getPublicRecipesBySearch(searchText: string): Observable<any> {
    const url = `${this.recipesUrl}/search/public?search=${searchText}`;
    return this.http.get(url);
  }

  getMyRecipesBySearch(searchText: string, id: number): Observable<any> {
    const url = `${this.recipesUrl}/search/my/${id}?search=${searchText}`;
    return this.http.get(url);
  }

  getFavoriteRecipesBySearch(searchText: string, id: number): Observable<any> {
    const url = `${this.recipesUrl}/search/favorite/${id}?search=${searchText}`;
    return this.http.get(url);
  }

  getLikedRecipesBySearch(searchText: string, id: number): Observable<any> {
    const url = `${this.recipesUrl}/search/liked/${id}?search=${searchText}`;
    return this.http.get(url);
  }

  getRecipesOfCategoryBySearch(
    searchText: string,
    categoryId: number,
    userId: number,
  ): Observable<any> {
    const url = `${this.recipesUrl}/search/by-category/${categoryId}/${userId}?search=${searchText}`;
    return this.http.get(url);
  }

  getCookedRecipesBySearch(searchText: string, id: number): Observable<any> {
    const url = `${this.recipesUrl}/search/cooked/${id}?search=${searchText}`;
    return this.http.get(url);
  }
  getFollowingRecipesBySearch(searchText: string, id: number): Observable<any> {
    const url = `${this.recipesUrl}/search/following/${id}?search=${searchText}`;
    return this.http.get(url);
  }

  approveRecipe(recipeId: number) {
    return this.http.put(`${this.recipesUrl}/approve/${recipeId}`, {});
  }
  makeRecipeAwaits(recipeId: number) {
    return this.http.put(`${this.recipesUrl}/make-awaits/${recipeId}`, {});
  }
  dismissRecipe(recipeId: number) {
    return this.http.put(`${this.recipesUrl}/dismiss/${recipeId}`, {});
  }

  getPublicAndMyRecipesBySearch(
    searchText: string,
    id: number,
  ): Observable<any> {
    const url = `${this.recipesUrl}/search/public-and-my/${id}?search=${searchText}`;
    return this.http.get(url);
  }

  getDiscussedRecipesBySearch(searchText: string): Observable<any> {
    const url = `${this.recipesUrl}/search/discussed?search=${searchText}`;
    return this.http.get(url);
  }

  getCommentedRecipesBySearch(searchText: string, id: number): Observable<any> {
    const url = `${this.recipesUrl}/search/commented/${id}?search=${searchText}`;
    return this.http.get(url);
  }
  getRecipesByIngredientBySearch(
    searchText: string,
    userId: number,
    ingredientId: number,
  ): Observable<any> {
    const url = `${this.recipesUrl}/search/by-ingredient/${userId}/${ingredientId}?search=${searchText}`;
    return this.http.get(url);
  }
  getPlannedRecipesBySearch(searchText: string, id: number): Observable<any> {
    const url = `${this.recipesUrl}/search/planned/${id}?search=${searchText}`;
    return this.http.get(url);
  }

  recipesUrl = recipesSource;

  setCategoryToRecipe(categoryId: number, recipeId: number) {
    const url = `${this.recipesUrl}/set-category/${recipeId}`;
    return this.http.put(url, { id: categoryId });
  }

  unsetCategoryToRecipe(categoryId: number, recipeId: number) {
    const url = `${this.recipesUrl}/unset-category/${recipeId}`;
    return this.http.put(url, { id: categoryId });
  }

  postIngredientToRecipe(
    recipeId: number,
    quantity: string,
    name: string,
    unit: string,
  ) {
    const url = `${this.recipesUrl}/ingredient/${recipeId}`;
    return this.http.post(url, { name: name, quantity: quantity, unit: unit });
  }

  postRecipe(recipe: IRecipe) {
    return this.http.post(this.recipesUrl, recipe);
  }

  addNewRecipe(recipe: IRecipe) {
    const currentRecipes = this.recipesSubject.value;
    let updatedRecipes: IRecipe[] = [];
    const index = currentRecipes.findIndex((r) => r.id === recipe.id);

    if (index !== -1) {
      updatedRecipes = [...currentRecipes];
      updatedRecipes[index] = recipe;
    } else {
      updatedRecipes = [...currentRecipes, recipe];
    }
    this.recipesSubject.next(updatedRecipes);
  }

  getAwaitingRecipesCount() {
    return this.http.get(`${this.recipesUrl}/awaits-count`);
  }

  updateRecipeInRecipes(recipe: IRecipe) {
    const currentRecipes = this.recipesSubject.value;
    const index = currentRecipes.findIndex((r) => r.id === recipe.id);
    if (index !== -1) {
      const updatedRecipes = [...currentRecipes];
      updatedRecipes[index] = recipe;

      this.recipesSubject.next(updatedRecipes);
    }
  }

  voteForRecipe(recipe: IRecipe, userId: number, userChoice: boolean): IRecipe {
    const statistic: IRecipeStatistics = {
      user: userId,
      answer: userChoice,
    };
    if (!recipe.statistics) recipe.statistics = [];
    recipe.statistics.push(statistic);
    return recipe;
  }

  removeVote(recipe: IRecipe, userId: number): IRecipe {
    if (!recipe.statistics) recipe.statistics = [];

    recipe.statistics = recipe.statistics.filter(
      (stat) => stat.user !== userId,
    );
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

  getRecipeInfo(recipe: IRecipe, avatar?: boolean, fullMode?: boolean) {
    const subscribes: Observable<any>[] = [];
    recipe.reports = recipe.reports || [];
    recipe.comments = recipe.comments || [];
    recipe.ingredients = recipe.ingredients || [];
    if (recipe.authorId && recipe.loadAuthor != 'no')
      subscribes.push(
        this.getAuthorInfo(recipe.authorId).pipe(
          tap((author: IUser) => {
            this.userService.addUserToUsers(author);
            if (avatar) {
              this.userService.getAvatar(author);
            }
          }),
        ),
      );
    else if (!recipe.loadAuthor) recipe.authorId = -1;

    if (fullMode) {
      subscribes.push(
        this.categoryService.getShortCategoriesByRecipe(recipe.id).pipe(
          tap((receivedCategories: ICategory[]) => {
            this.categoryService.setCategories(receivedCategories);
            const categoriesIDs = receivedCategories.map(
              (category) => category.id,
            );
            recipe.categories = categoriesIDs;
          }),
        ),
      );

      subscribes.push(
        this.getVotes(recipe.id).pipe(
          tap((response) => {
            recipe.statistics = this.translateStatistics(response);
          }),
        ),
      );
    }

    return subscribes;
  }

  getRecipesInfo(recipes: IRecipe[], image?: boolean, fullMode?: boolean) {
    let subscribes: Observable<any>[] = [];
    recipes.forEach((recipe) => {
      subscribes = [...subscribes, ...this.getRecipeInfo(recipe, fullMode)];

      if (image) {
        this.getRecipeImage(recipe);
      }
    });

    return subscribes;
  }

  setImageToRecipe(recipeId: number, imageURL: string) {
    const currentRecipes = this.recipesSubject.value;
    const index = currentRecipes.findIndex((r) => r.id === recipeId);
    if (index !== -1) {
      const updatedRecipes = [...currentRecipes];
      updatedRecipes[index] = { ...updatedRecipes[index], imageURL: imageURL };
      this.recipesSubject.next(updatedRecipes);
    }
  }

  setLoadingToRecipe(recipeId: number, state: boolean) {
    const currentRecipes = this.recipesSubject.value;
    const index = currentRecipes.findIndex((r) => r.id === recipeId);
    if (index !== -1) {
      const updatedRecipes = [...currentRecipes];
      updatedRecipes[index] = { ...updatedRecipes[index], imageLoading: state };
      this.recipesSubject.next(updatedRecipes);
    }
  }

  getRecipeImage(recipe: IRecipe) {
    if (recipe.mainImage) {
      recipe.imageLoading = true;
      this.updateRecipeInRecipes(recipe);

      setTimeout(() => {
        if (recipe.mainImage)
          this.downloadImage(recipe.mainImage)
            .pipe(
              catchError(() => { return EMPTY }),
              finalize(() => {
                this.setLoadingToRecipe(recipe.id, false);
              }),
              tap((blob) => {
                this.setImageToRecipe(recipe.id, URL.createObjectURL(blob));
              }),
            )
            .subscribe();
      }, 300);
    }
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

  getShortRecipe(recipeId: number) {
    return this.http.get<IRecipe>(
      `${this.recipesUrl}/short-recipe/${recipeId}`,
    );
  }

  getRecipe(recipeId: number, userId: number) {
    return this.http.get<IRecipe>(
      `${this.recipesUrl}/recipe/${recipeId}/${userId}`,
    );
  }

  deleteRecipe(recipeId: number) {
    return this.http.delete<IRecipe>(`${this.recipesUrl}/${recipeId}`);
  }

  getIngredients(recipeId: number) {
    const url = `${this.recipesUrl}/ingredients/${recipeId}`;
    return this.http.get(url);
  }
  getInstructions(recipeId: number) {
    const url = `${this.recipesUrl}/instructions/${recipeId}`;
    return this.http.get<Instruction[]>(url);
  }
  getInstructionsImages(recipeId: number) {
    const url = `${this.recipesUrl}/instructions-images/${recipeId}`;
    return this.http.get<{ instructionId: number; image: string }[]>(url);
  }
  getInstructionImages(instructionId: number) {
    const url = `${this.recipesUrl}/instruction-images/${instructionId}`;
    return this.http.get<string[]>(url);
  }

  deleteInstruction(instructionId: number) {
    const url = `${this.recipesUrl}/instruction/${instructionId}`;
    return this.http.delete(url);
  }
  postInstruction(recipeId: number, instruction: string) {
    const url = `${this.recipesUrl}/instruction`;
    return this.http.post(url, {
      recipeId: recipeId,
      instruction: instruction,
    });
  }
  postInstructionImage(instructionId: number, filename: string) {
    const url = `${this.recipesUrl}/instruction-image`;
    return this.http.post(url, {
      instructionId: instructionId,
      filename: filename,
    });
  }

  uploadInstructionImage(file: File) {
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(`${this.recipesUrl}/image`, formData);
  }

  deleteAllIngredients(recipeId: number) {
    const url = `${this.recipesUrl}/ingredients/${recipeId}`;
    return this.http.delete(url);
  }
  getRelatedIngredients(recipeId: number) {
    const url = `${this.recipesUrl}/related-ingredients/${recipeId}`;
    return this.http.get<{ name: string; id: number; groupId: number }[]>(url);
  }

  deleteImage(imagePath: string) {
    const url = `${this.recipesUrl}/files/${imagePath}`;
    return this.http.delete(url);
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

  getSomeRecipesByUser(
    limit: number,
    page: number,
    userId: number,
    full?: boolean,
  ) {
    const url = `${
      this.recipesUrl
    }/by-user/${userId}?limit=${limit}&page=${page}${full ? '&mode=full' : ''}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomePopularRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/popular/${userId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeAwaitingRecipes(limit: number, page: number) {
    const url = `${this.recipesUrl}/awaiting?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }
  getMostCommentedRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/most-commented/${userId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeRecipesByIngredient(
    limit: number,
    page: number,
    categoryId: number,
    userId: number,
  ) {
    const url = `${this.recipesUrl}/by-ingredient/${categoryId}/${userId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeRecipesByCategory(
    limit: number,
    page: number,
    categoryId: number,
    userId: number,
  ) {
    const url = `${this.recipesUrl}/by-category/${categoryId}/${userId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.recipesUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  uploadRecipeImage(file: File) {
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(`${this.recipesUrl}/image`, formData);
  }

  getSomeUserFavoriteRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/user-favorites?limit=${limit}&page=${page}&userId=${userId}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeUserPlannedRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/user-planned?limit=${limit}&page=${page}&userId=${userId}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeUserFollowedRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/followed?limit=${limit}&page=${page}&userId=${userId}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeUserCommentedRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/user-comments?limit=${limit}&page=${page}&userId=${userId}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }
  getSomeUserLikedRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/user-liked?limit=${limit}&page=${page}&userId=${userId}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }
  getSomeUserCookedRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/user-cooked?limit=${limit}&page=${page}&userId=${userId}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeMostCookedRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/most-cooked/${userId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeMostFavoriteRecipes(limit: number, page: number, userId: number) {
    const url = `${this.recipesUrl}/most-favorite/${userId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeRecipesForUserpage(
    limit: number,
    page: number,
    authorId: number,
    currentUserId: number,
  ) {
    const url = `${this.recipesUrl}/userpage/${authorId}/${currentUserId}?limit=${limit}&page=${page}`;
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getSomeMostRecentRecipes(
    limit: number,
    page: number,
    currentUserId:number,
    except?: number,
    authorId?: number,
  ) {
    const url =
      `${this.recipesUrl}/most-recent?limit=${limit}&page=${page}&currentUserId=${currentUserId}` +
      (except ? `&except=${except}&authorId=${authorId}` : '');
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }
  getSomeSimilarRecipes(
    limit: number,
    page: number,
    except?: number,
    authorId?: number,
  ) {
    const url =
      `${this.recipesUrl}/similar?limit=${limit}&page=${page}` +
      (except ? `&except=${except}&authorId=${authorId}` : '');
    return this.http.get<{ recipes: IRecipe[]; count: number }>(url);
  }

  getLikes(recipeId: number) {
    return this.http.get<{ likesIds: number[] }>(
      `${this.recipesUrl}/likes/${recipeId}`,
    );
  }

  getVotes(recipeId: number) {
    return this.http.get<IRecipeStatistics[]>(
      `${this.recipesUrl}/votes/${recipeId}`,
    );
  }

  getCategories(recipeId: number) {
    return this.http.get<{ categoriesIds: number[] }>(
      `${this.recipesUrl}/categories/${recipeId}`,
    );
  }

  getCooks(recipeId: number) {
    return this.http.get<{ cooksIds: number[] }>(
      `${this.recipesUrl}/cooks/${recipeId}`,
    );
  }

  pushToFavorites(recipeId: number, userId: number) {
    return this.http.post(
      `${this.recipesUrl}/favorites/${recipeId}/${userId}`,
      {},
    );
  }

  removeFromFavorites(recipeId: number, userId: number) {
    return this.http.delete(
      `${this.recipesUrl}/favorites/${recipeId}/${userId}`,
    );
  }

  deleteRecipeFromRecipes(recipeId: number) {
    this.recipesSubject.next(
      this.recipesSubject.value.filter((recipe) => recipe.id !== recipeId),
    );
  }

  translateStatistics(statistics: any) {
    const translatedStatistics: IRecipeStatistics[] = [];
    statistics.forEach((s: any) => {
      const translated: IRecipeStatistics = {
        user: s.user,
        answer: s.answer == 'true' ? true : false,
      };
      translatedStatistics.push(translated);
    });
    return translatedStatistics;
  }
  setLike(recipeId: number, userId: number) {
    return this.http.post(`${this.recipesUrl}/likes/${recipeId}/${userId}`, {});
  }
  setRecipes(recipes: IRecipe[]) {
    this.recipesSubject.next(recipes);
  }

  unsetLike(recipeId: number, userId: number) {
    return this.http.delete(`${this.recipesUrl}/likes/${recipeId}/${userId}`);
  }

  setCook(recipeId: number, userId: number) {
    return this.http.post(`${this.recipesUrl}/cooks/${recipeId}/${userId}`, {});
  }

  unsetCook(recipeId: number, userId: number) {
    return this.http.delete(`${this.recipesUrl}/cooks/${recipeId}/${userId}`);
  }

  removeVoteForRecipe(recipeId: number, userId: number) {
    return this.http.delete(`${this.recipesUrl}/votes/${recipeId}/${userId}`);
  }

  pushVoteForRecipe(recipeId: number, userId: number, vote: boolean) {
    return this.http.post(
      `${this.recipesUrl}/votes/${recipeId}/${userId}/${vote ? 1 : 0}`,
      {},
    );
  }

  getAuthorInfo(authorId: number) {
    return this.http.get<IUser>(`${this.recipesUrl}/author/${authorId}`);
  }

  getMostShortedRecipe(id: number) {
    return this.http.get<IRecipe>(`${this.recipesUrl}/most-shorted-recipe/${id}`);
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
    return this.http.put(`${this.recipesUrl}/${recipe.id}`, recipe);
  }
}
