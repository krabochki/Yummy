import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe, IRecipeStatistics } from '../../../models/recipes';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ICategory, nullCategory } from '../../../models/categories';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import {
  RecipeType,
  recipeNoRecipesButtonText,
  recipeNoRecipesText,
  recipeNoRecipesRouterLinkText,
  recipeTitles,
} from './consts';
import {
  EMPTY,
  Observable,
  Subject,
  finalize,
  forkJoin,
  takeUntil,
  tap,
} from 'rxjs';
import { baseComparator } from 'src/tools/common';
import { IIngredient, nullIngredient } from '../../../models/ingredients';
import { CategoryService } from '../../../services/category.service';
import { IngredientService } from '../../../services/ingredient.service';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

@Component({
  templateUrl: './some-recipes-page.component.html',
  styleUrls: [
    './some-recipes-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
})
export class SomeRecipesPageComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private authService: AuthService,
    private userService: UserService,
    private title: Title,
    private router: Router,
    private cd: ChangeDetectorRef,
    private categoryService: CategoryService,
  ) {
    const matchRecipes =
      this.router.getCurrentNavigation()?.extras.state?.['recipes'];
    if (matchRecipes) {
      this.matchRecipes = matchRecipes;
    }
  }

  editModal = false;
  deleteModal = false;

  protected creatingMode: boolean = false;
  protected filter: string = '';
  ingredient: IIngredient = nullIngredient;
  protected recipesToShow: IRecipe[] = [];
  protected allRecipes: IRecipe[] = [];

  protected category: ICategory = nullCategory;

  loadingPlannedRecipes = true;
  loadingPopularRecipes = true;
  loadingRecentRecipes = true;
  loadingDiscussedRecipes = true;
  loadingCommentedRecipes = true;
  loadingMyRecipes = true;
  loadingCookedRecipes = true;
  loadingFavoriteRecipes = true;
  loadingFollowingRecipes = true;
  loadingLikedRecipes = true;
  loadingMostCookedRecipes = true;
  loadingMostFavoriteRecipes = true;

  protected recentRecipes: IRecipe[] = [];
  protected plannedRecipes: IRecipe[] = [];
  protected popularRecipes: IRecipe[] = [];
  protected discussedRecipes: IRecipe[] = [];
  protected commentedRecipes: IRecipe[] = [];
  protected myRecipes: IRecipe[] = [];
  protected likedRecipes: IRecipe[] = [];
  protected cookedRecipes: IRecipe[] = [];
  protected favoriteRecipes: IRecipe[] = [];
  protected followingRecipes: IRecipe[] = [];
  protected mostCooked: IRecipe[] = [];
  protected mostFavorite: IRecipe[] = [];
  protected matchRecipes: IRecipe[] = [];

  categories: ICategory[] = [];

  protected currentUser: IUser = { ...nullUser };
  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocomplete: IRecipe[] = [];
  private allUsers: IUser[] = [];
  protected recipeType: RecipeType = RecipeType.All;

  private destroyed$: Subject<void> = new Subject<void>();

  minHorizontalLength = 5;

  noAccessModalShow = false;
  recipes: IRecipe[] = [];
  currentUserId = 0;

  ngOnInit(): void {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 768) {
      this.RECIPES_PER_STEP = 4;
      this.minHorizontalLength = 3;
    } else if (screenWidth <= 1200) {
      this.minHorizontalLength = 4;

      this.RECIPES_PER_STEP = 6;
    } else {
      this.minHorizontalLength = 5;
    }

    this.authService.getTokenUser().subscribe((receivedUser) => {
      this.currentUserId = receivedUser.id;
      this.usersInit();
      this.route.data.subscribe((data) => {
        this.recipes = [];
        this.loaded = false;
        this.init = false;
        this.recipesToShow = [];
        this.recipeService.recipesSubject.next([]);
        this.userService.usersSubject.next([]);
        this.filter = data['filter'];
        if (this.filter === 'matching' && this.matchRecipes.length === 0)
          this.router.navigateByUrl('/recipes');
        this.setRecipeType(this.filter);
        this.recipeSourceInit(
          data['CategoryResolver'],
          data['IngredientResolver'],
        );
        this.currentUserInit();

        this.cd.markForCheck();
      });
    });

    this.recipeService.recipes$.subscribe((recipes) => {
      this.recipes = recipes;
    });
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  createRecipeButtonClick() {
    if (this.currentUser.id > 0) {
      this.creatingMode = true;
    } else {
      this.noAccessModalShow = true;
    }
  }

  private setRecipeType(filter: string): void {
    switch (filter) {
      case 'matching':
        this.recipeType = RecipeType.Match;
        break;
      case 'recent':
        this.recipeType = RecipeType.Recent;
        break;
      case 'planned':
        this.recipeType = RecipeType.Planning;
        break;
      case 'all':
        this.recipeType = RecipeType.All;
        this.loaded = true;
        break;
      case 'my-recipes':
        this.recipeType = RecipeType.My;
        break;
      case 'favorite':
        this.recipeType = RecipeType.Favorite;
        break;
      case 'popular':
        this.recipeType = RecipeType.Popular;
        break;
      case 'liked':
        this.recipeType = RecipeType.Liked;
        break;
      case 'cooked':
        this.recipeType = RecipeType.Cooked;
        break;
      case 'category-recipes':
        this.recipeType = RecipeType.Category;
        break;
      case 'updates':
        this.recipeType = RecipeType.Updates;
        break;
      case 'discussed':
        this.recipeType = RecipeType.Discussed;
        break;
      case 'commented':
        this.recipeType = RecipeType.Commented;
        break;
      case 'most-cooked':
        this.recipeType = RecipeType.MostCooked;
        break;
      case 'most-favorite':
        this.recipeType = RecipeType.MostFavorite;
        break;
      case 'ingredient-recipes':
        this.recipeType = RecipeType.ByIngredient;
    }
  }

  

  showCategoryButtons() {
        return this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.CategoryManagingButtons,
        );

  }

  private getRecipesOfAllTypes(): void {
      if (this.recipeType === RecipeType.All) {
        const withoutAuth$: Observable<any>[] = [];
        const withAuth$: Observable<any>[] = [];

        withoutAuth$.push(this.getPopularRecipes());
        withoutAuth$.push(this.getMostCookedRecipes());
        withoutAuth$.push(this.getMostFavoriteRecipes());
        withoutAuth$.push(this.getMostCommentedRecipes());
        withoutAuth$.push(this.getMostRecentRecipes());

        if (this.currentUserId > 0) {
          withAuth$.push(this.getCurrentUserRecipes());
          withAuth$.push(this.getCookedRecipesOfCurrentUser());
          withAuth$.push(this.getLikedRecipesOfCurrentUser());
          withAuth$.push(this.getCommentedRecipesOfCurrentUser());
          withAuth$.push(this.getFavoriteRecipesOfCurrentUser());
          withAuth$.push(this.getCurrentUserPlannedRecipes());
          withAuth$.push(this.getCurrentUserFollowedRecipes());
        }

        forkJoin([...withoutAuth$, ...withAuth$]).subscribe();
      } else {
        this.startRecipesInit();
      }
  }

  updateRecipesAfterCategoryEditing() {
    this.categoryService
      .getCategory(this.category.id)
      .pipe(
        tap((categories: any) => {
          const category = categories[0];
          this.category = category;
          this.title.setTitle(category.name);

          this.startRecipesInit();
        }),
      )
      .subscribe();
  }

  updateRecipes() {
    if (this.filter === 'all') {
      this.loadingMyRecipes = true;
      this.myRecipes = [];
      this.recentRecipes = [];
      this.loadingRecentRecipes = true;
        const withoutAuth$: Observable<any>[] = [];
        withoutAuth$.push(this.getCurrentUserRecipes());
        withoutAuth$.push(this.getMostRecentRecipes());
        forkJoin(withoutAuth$).subscribe();
    } else {
      this.startRecipesInit();
    }
  }

  get searchType() {
    if (this.recipeType === RecipeType.All) {
      if (this.currentUserId) {
        return 'public-and-my-recipes';
      } else {
        return 'public-recipes';
      }
    } else {
      switch (this.recipeType) {
        case RecipeType.Recent:
          return 'public-recipes';
        case RecipeType.Popular:
          return 'public-recipes';

        case RecipeType.My:
          return 'my-recipes';

        case RecipeType.Favorite:
          return 'favorite-recipes';

        case RecipeType.Category:
          return 'category-recipes';
        case RecipeType.Liked:
          return 'liked-recipes';

        case RecipeType.Cooked:
          return 'cooked-recipes';
        case RecipeType.Match:
          return '';
        case RecipeType.Updates:
          return 'following-recipes';
        case RecipeType.Discussed:
          return 'discussed-recipes';
        case RecipeType.Commented:
          return 'commented-recipes';
        case RecipeType.Planning:
          return 'planned-recipes';
        case RecipeType.MostCooked:
          return 'public-recipes';
        case RecipeType.MostFavorite:
          return 'public-recipes';

        case RecipeType.ByIngredient:
          return 'recipes-by-ingredient';
      }
    }
  }

  startRecipesInit() {
    this.currentStep = 0;
    this.everythingLoaded = false;

    this.recipeService.recipesSubject.next([]);
    this.recipesToShow = [];
    this.userService.usersSubject.next([]);
    this.loadMoreRecipes();
  }

  private getCurrentUserPlannedRecipes() {
    return this.recipeService
      .getSomeUserPlannedRecipes(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          newRecipes.forEach((recipe) => {
            recipe = this.recipeService.translateRecipe(recipe);

            this.recipeService.addNewRecipe(recipe);
          });
          const subscribes = this.recipeService.getRecipesInfo(
            newRecipes,
            true,
          );
          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loadingPlannedRecipes = false;
                this.plannedRecipes = recipes;

                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }

  private getCurrentUserFollowedRecipes() {
    return this.recipeService
      .getSomeUserFollowedRecipes(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          newRecipes.forEach((recipe) => {
            recipe = this.recipeService.translateRecipe(recipe);

            this.recipeService.addNewRecipe(recipe);
          });

          const subscribes = this.recipeService.getRecipesInfo(
            newRecipes,
            true,
          );
          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loadingFollowingRecipes = false;
                this.followingRecipes = recipes;
                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }
  private getCurrentUserRecipes() {
    return this.recipeService
      .getSomeRecipesByUser(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          newRecipes.forEach((recipe) => {
            recipe = this.recipeService.translateRecipe(recipe);

            this.recipeService.addNewRecipe(recipe);
          });

          const subscribes = this.recipeService.getRecipesInfo(
            newRecipes,
            true,
          );
          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loadingMyRecipes = false;
                this.myRecipes = recipes;
                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }

  private getFavoriteRecipesOfCurrentUser() {
    return this.recipeService
      .getSomeUserFavoriteRecipes(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          newRecipes.forEach((recipe) => {
            recipe = this.recipeService.translateRecipe(recipe);
            this.recipeService.addNewRecipe(recipe);
          });
          const subscribes = this.recipeService.getRecipesInfo(
            newRecipes,
            true,
          );
          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loadingFavoriteRecipes = false;
                this.favoriteRecipes = recipes;
                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }

  private getLikedRecipesOfCurrentUser() {
    return this.recipeService
      .getSomeUserLikedRecipes(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });

          newRecipes.forEach((recipe) => {
            recipe = this.recipeService.translateRecipe(recipe);
            this.recipeService.addNewRecipe(recipe);
          });

          const subscribes = this.recipeService.getRecipesInfo(
            newRecipes,
            true,
          );

          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loadingLikedRecipes = false;
                this.likedRecipes = recipes;
                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }

  private getCommentedRecipesOfCurrentUser() {
    return this.recipeService
      .getSomeUserCommentedRecipes(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          newRecipes.forEach((recipe) => {
            recipe = this.recipeService.translateRecipe(recipe);
            this.recipeService.addNewRecipe(recipe);
          });
          const subscribes = this.recipeService.getRecipesInfo(
            newRecipes,
            true,
          );
          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loadingCommentedRecipes = false;
                this.commentedRecipes = recipes;

                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }

  private getCookedRecipesOfCurrentUser() {
    return this.recipeService
      .getSomeUserCookedRecipes(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          newRecipes.forEach((recipe) => {
            recipe = this.recipeService.translateRecipe(recipe);

            this.recipeService.addNewRecipe(recipe);
          });
          const subscribes = this.recipeService.getRecipesInfo(
            newRecipes,
            true,
          );
          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loadingCookedRecipes = false;

                this.cookedRecipes = recipes;

                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }

  private getMostRecentRecipes() {
    return this.recipeService.getSomeMostRecentRecipes(8, 0).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;

        const newRecipes: IRecipe[] = recipes.filter((recipe) => {
          return !this.recipes.some(
            (existingRecipe) => existingRecipe.id === recipe.id,
          );
        });
        newRecipes.forEach((recipe) => {
          recipe = this.recipeService.translateRecipe(recipe);
          this.recipeService.addNewRecipe(recipe);
        });

        const subscribes = this.recipeService.getRecipesInfo(newRecipes, true);
        forkJoin(subscribes)
          .pipe(
            finalize(() => {
              this.loadingRecentRecipes = false;
              this.recentRecipes = recipes;
              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }),
    );
  }
  private getPopularRecipes() {
    return this.recipeService.getSomePopularRecipes(8, 0).pipe(
      tap((response) => {
        this.loadingPopularRecipes = false;
        const recipes: IRecipe[] = response.recipes;

        const newRecipes: IRecipe[] = recipes.filter((recipe) => {
          return !this.recipes.some(
            (existingRecipe) => existingRecipe.id === recipe.id,
          );
        });
        newRecipes.forEach((recipe) => {
          recipe = this.recipeService.translateRecipe(recipe);
          this.recipeService.addNewRecipe(recipe);
        });

        const subscribes = this.recipeService.getRecipesInfo(newRecipes, true);
        forkJoin(subscribes)
          .pipe(
            finalize(() => {
              this.loadingPopularRecipes = false;
              this.popularRecipes = recipes;

              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }),
    );
  }

  private getMostCommentedRecipes() {
    return this.recipeService.getMostCommentedRecipes(8, 0).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const newRecipes: IRecipe[] = recipes.filter((recipe) => {
          return !this.recipes.some(
            (existingRecipe) => existingRecipe.id === recipe.id,
          );
        });

        newRecipes.forEach((recipe) => {
          recipe = this.recipeService.translateRecipe(recipe);
          this.recipeService.addNewRecipe(recipe);
        });

        const subscribes = this.recipeService.getRecipesInfo(newRecipes, true);
        forkJoin(subscribes)
          .pipe(
            finalize(() => {
              this.loadingDiscussedRecipes = false;
              this.discussedRecipes = recipes;

              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }),
    );
  }
  private getMostCookedRecipes() {
    return this.recipeService.getSomeMostCookedRecipes(8, 0).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const newRecipes: IRecipe[] = recipes.filter((recipe) => {
          return !this.recipes.some(
            (existingRecipe) => existingRecipe.id === recipe.id,
          );
        });
        newRecipes.forEach((recipe) => {
          recipe = this.recipeService.translateRecipe(recipe);

          this.recipeService.addNewRecipe(recipe);
        });

        const subscribes = this.recipeService.getRecipesInfo(newRecipes, true);
        forkJoin(subscribes)
          .pipe(
            finalize(() => {
              this.loadingMostCookedRecipes = false;
              this.mostCooked = recipes;

              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }),
    );
  }

  private getMostFavoriteRecipes() {
    return this.recipeService.getSomeMostFavoriteRecipes(8, 0).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const newRecipes: IRecipe[] = recipes.filter((recipe) => {
          return !this.recipes.some(
            (existingRecipe) => existingRecipe.id === recipe.id,
          );
        });
        newRecipes.forEach((recipe) => {
          recipe = this.recipeService.translateRecipe(recipe);

          this.recipeService.addNewRecipe(recipe);
        });

        const subscribes = this.recipeService.getRecipesInfo(newRecipes, true);
        forkJoin(subscribes)
          .pipe(
            finalize(() => {
              this.loadingMostFavoriteRecipes = false;
              this.mostFavorite = recipes;

              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }),
    );
  }

  loaded: boolean = false;
  RECIPES_PER_STEP = 8;
  everythingLoaded: boolean = false;
  currentStep = 0;

  loadMoreRecipes() {
    if (this.loaded || !this.recipesToShow.length) {
      this.loaded = false;
        let context: Observable<any> = EMPTY;

        switch (this.recipeType) {
          case RecipeType.Planning:
            context = this.recipeService.getSomeUserPlannedRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.currentUserId,
            );
            break;
          case RecipeType.ByIngredient:
            context = this.recipeService.getSomeRecipesByIngredient(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.ingredient.id,
              this.currentUserId,
            );
            break;
          case RecipeType.Category:
            context = this.recipeService.getSomeRecipesByCategory(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.category.id,
              this.currentUserId,
            );
            break;
          case RecipeType.Match:
            break;
          case RecipeType.Discussed:
            context = this.recipeService.getMostCommentedRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
            );
            break;
          case RecipeType.MostCooked:
            context = this.recipeService.getSomeMostCookedRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
            );
            break;
          case RecipeType.MostFavorite:
            context = this.recipeService.getSomeMostFavoriteRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
            );
            break;
          case RecipeType.Popular:
            context = this.recipeService.getSomePopularRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
            );
            break;
          case RecipeType.Updates:
            context = this.recipeService.getSomeUserFollowedRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.currentUserId,
            );
            break;
          case RecipeType.Recent:
            context = this.recipeService.getSomeMostRecentRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
            );
            break;
          case RecipeType.My:
            context = this.recipeService.getSomeRecipesByUser(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.currentUserId,
            );
            break;
          case RecipeType.Favorite:
            context = this.recipeService.getSomeUserFavoriteRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.currentUserId,
            );
            break;
          case RecipeType.Commented:
            context = this.recipeService.getSomeUserCommentedRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.currentUserId,
            );
            break;
          case RecipeType.Liked:
            context = this.recipeService.getSomeUserLikedRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.currentUserId,
            );
            break;
          case RecipeType.Cooked:
            context = this.recipeService.getSomeUserCookedRecipes(
              this.RECIPES_PER_STEP,
              this.currentStep,
              this.currentUserId,
            );
            break;
        }
        context
          .pipe(
            tap((response: any) => {
              const recipes: IRecipe[] = response.recipes;
              const subscribes = this.recipeService.getRecipesInfo(
                recipes,
                true,
              );
              forkJoin(subscribes)
                .pipe(
                  finalize(() => {
                    this.loaded = true;
                    this.cd.markForCheck();
                  }),
                  tap(() => {
                    const length: number = response.count;
                    const receivedRecipes: IRecipe[] = response.recipes;

                    this.recipesToShow = [
                      ...this.recipesToShow,
                      ...receivedRecipes,
                    ];

                    if (length <= this.recipesToShow.length) {
                      this.everythingLoaded = true;
                    }
                    this.currentStep++;

                    recipes.forEach((recipe) => {
                      recipe = this.recipeService.translateRecipe(recipe);

                      this.recipeService.addNewRecipe(recipe);
                    });
                    this.cd.markForCheck();
                  }),
                )
                .subscribe();
            }),
          )
          .subscribe();
    }
  }

  private recipeSourceInit(
    categoryFromData: ICategory,
    ingredientFromData: IIngredient,
  ): void {
    if (this.recipeType === RecipeType.Category) {
      this.category = categoryFromData;
    }
    if (this.recipeType === RecipeType.ByIngredient) {
      this.ingredient = ingredientFromData;
    }

    this.getRecipesOfAllTypes();

    this.title.setTitle(this.getTitleByRecipeType(this.recipeType));
  }

  private usersInit(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.allUsers = data;
      });
  }

  init = false;

  private currentUserInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user: IUser) => {
        this.currentUser = user;
      });
  }

  protected getUser(userId: number): IUser {
    const finded = this.allUsers.find((user) => user.id === userId);
    if (finded) return finded;
    return { ...nullUser };
  }

  protected focus(): void {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }
  protected blur(): void {
    this.autocompleteShow = false;
  }
  protected search(): void {
    this.autocompleteShow = true;
    const recipeAuthors: IUser[] = [];
    this.allRecipes.forEach((element) => {
      recipeAuthors.push(this.getUser(element.authorId));
    });
    if (this.searchQuery && this.searchQuery !== '') {
      this.autocomplete = [];

      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      const filterRecipes: IRecipe[] = this.allRecipes.filter(
        (recipe: IRecipe) =>
          recipe.name.toLowerCase().replace(/\s/g, '').includes(search),
      );

      filterRecipes.forEach((element) => {
        this.autocomplete.push(element);
      });
      this.autocomplete = this.autocomplete.sort((a, b) =>
        baseComparator(a.name, b.name),
      );
    } else this.autocompleteShow = false;
  }

  protected getTitleByRecipeType(recipeType: RecipeType): string {
    if (recipeType === RecipeType.Category) {
      return this.category.name;
    }
    if (recipeType === RecipeType.ByIngredient) {
      return this.ingredient.name;
    }
    return recipeTitles[recipeType] || '';
  }
  protected getNoRecipesTextByRecipetype(recipeType: RecipeType): string {
    if (recipeType === RecipeType.ByIngredient) {
      return `Ни один кулинар пока что не создал рецепт с ингредиентом «${this.ingredient.name}». Можете перейти ко всем ингредиентам и поискать рецепт с чем-нибудь другим`;
    }
    return recipeNoRecipesText[recipeType] || '';
  }
  protected getNoRecipesButtonTextByRecipetype(recipeType: RecipeType): string {
    return recipeNoRecipesButtonText[recipeType] || '';
  }
  protected getNoRecipesRouterLinkTextByRecipetype(
    recipeType: RecipeType,
  ): string {
    return recipeNoRecipesRouterLinkText[recipeType] || '';
  }

  protected navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
