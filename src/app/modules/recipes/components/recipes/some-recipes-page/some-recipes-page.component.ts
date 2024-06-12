import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe, RecipeGroup } from '../../../models/recipes';
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
  Subscription,
  catchError,
  concatMap,
  finalize,

  from,
  last,
  of,
  takeUntil,
  tap,
} from 'rxjs';
import {  getFormattedDate } from 'src/tools/common';
import { IIngredient, nullIngredient } from '../../../models/ingredients';
import { CategoryService } from '../../../services/category.service';
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
    trigger('height', heightAnim()),
  ],
})
export class SomeRecipesPageComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private title: Title,
    private router: Router,
    private cd: ChangeDetectorRef,
    private categoryService: CategoryService,
  ) {
    // const matchRecipes =
    //   this.router.getCurrentNavigation()?.extras.state?.['recipes'];
    // if (matchRecipes) {
    //   this.matchRecipes = matchRecipes;
    // }
  }

  moreInfo = false;

  editModal = false;
  deleteModal = false;

  blocks = Array.from({ length: 6 }).map((_, index) => index + 1);

  protected creatingMode: boolean = false;
  protected filter: string = 'all';
  ingredient: IIngredient = nullIngredient;

  protected category: ICategory = nullCategory;

  recipesGroups: RecipeGroup[] = [];

  protected currentUser: IUser = { ...nullUser };
  protected recipeType: RecipeType = RecipeType.All;

  private destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();

  minHorizontalLength = 5;

  noAccessModalShow = false;
  recipes: IRecipe[] = [];
  currentUserId = 0;
  initialLoading = true;

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
    this.route.data.subscribe((data) => {
      this.subscriptions.add(
        this.authService.getTokenUser()
          .pipe(takeUntil(this.destroyed$))
          .subscribe((receivedUser) => {
          this.currentUserId = receivedUser.id;

          this.currentUserRole = receivedUser.role;
          window.scrollTo(0, 0);

          this.recipes = [];
          this.filter = data['filter'];
            this.setRecipeType(this.filter);
            
          this.recipeSourceInit(
            data['CategoryResolver'],
            data['IngredientResolver'],
          );          this.initialLoading = false;

                      this.loaded = false;

          this.currentUserInit();

          this.cd.markForCheck();
        }));
    });
  }

  currentUserRole = 'user';

  getDate(date: string) {
    return getFormattedDate(date);
  }

  handleDeleteModal(answer: boolean) {
    if (answer) {
      this.deleteCategory();
    }
    this.deleteModal = false;
  }

  deleteCategory() {
    this.awaitModal = true;

    const deleteCategory$ = this.categoryService
      .deleteCategory(this.category.id)
      .pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке удалить категорию',
          );
          return EMPTY;
        }),
      );

    const deleteImage$: Observable<any> = this.categoryService
      .deleteImage(this.category.id)
      .pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке удалить файл изображения категории',
          );
          return EMPTY;
        }),
      );

    deleteImage$
      .pipe(
        concatMap(() => deleteCategory$),
        finalize(() => {
          this.awaitModal = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successDeleteModal = true;
        },
      });
  }

  throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }

  awaitModal = false;
  errorModalContent = '';
  successDeleteModal = false;
  errorModal = false;

  handleErrorModal() {
    this.errorModal = false;
  }

  handleSuccessDeleteModal() {
    this.successDeleteModal = false;
    this.router.navigateByUrl('/categories');
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  createRecipeButtonClick() {
    if (!this.initialLoading) {
      if (this.currentUser.id > 0) {
        this.creatingMode = true;
      } else {
        this.noAccessModalShow = true;
      }
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
      case 'private':
        this.recipeType = RecipeType.Private;
        break;
      case 'awaits':
        this.recipeType = RecipeType.Awaits;
        break;

      case 'public':
        this.recipeType = RecipeType.Public;
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
    if (this.recipeType === RecipeType.My) {
        this.blocks = Array.from({ length: 3 }).map((_, index) => index + 1);

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
      const recipes$: Observable<any>[] = [];
      recipes$.push(this.getCurrentUserRecipes());
      recipes$.push(this.getCurrentUserPlannedRecipes());
      recipes$.push(this.getCurrentUserFollowedRecipes());
      recipes$.push(this.getLikedRecipesOfCurrentUser());
      recipes$.push(this.getCookedRecipesOfCurrentUser());
      recipes$.push(this.getCommentedRecipesOfCurrentUser());
      recipes$.push(this.getFavoriteRecipesOfCurrentUser());
      recipes$.push(this.getPopularRecipes());
      recipes$.push(this.getMostRecentRecipes());
      recipes$.push(this.getMostCommentedRecipes());
      recipes$.push(this.getMostFavoriteRecipes());
      recipes$.push(this.getMostCookedRecipes());
      this.subscriptions.add(from(recipes$)
        .pipe(
          takeUntil(this.destroyed$),
          concatMap((recipe$) => recipe$.pipe(takeUntil(this.destroyed$))),
          last(),
          finalize(() => {
            this.loaded = true;
            this.cd.markForCheck();
          }),
        )
        .subscribe());
    }
    else if (this.recipeType === RecipeType.My)
    {
            const recipes$: Observable<any>[] = [];
            recipes$.push(this.getMyRecipes(2));
            recipes$.push(this.getMyRecipes(1));
            recipes$.push(this.getMyRecipes(0));
            this.subscriptions.add(
              from(recipes$)
                .pipe(
                  takeUntil(this.destroyed$),
                  concatMap((recipe$) =>
                    recipe$.pipe(takeUntil(this.destroyed$)),
                  ),
                  last(),
                  finalize(() => {
                    this.loaded = true;
                    this.cd.markForCheck();
                  }),
                )
                .subscribe(),
            );

      
      }
    else {
      this.startRecipesInit();
    }
  }

  private loadRecipesImages(recipes: IRecipe[]) {
    recipes.forEach((recipe) => {
      if (recipe.mainImage) {
        recipe.imageLoading = true;

        this.subscriptions.add(
          this.recipeService
            .downloadRecipeImage(recipe.mainImage)
            .pipe(
              takeUntil(this.destroyed$),
              tap((blob) => {
                recipe.imageURL = URL.createObjectURL(blob);
              }),
              finalize(() => {
                recipe.imageLoading = false;
                this.cd.markForCheck();
              }),
            )
            .subscribe());
      }
    });
  }

  updateCategoryAfterEdit(name:string) {
    this.category = { ...this.category, name: name };
            this.title.setTitle(this.category.name);
            this.cd.markForCheck();

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
        case RecipeType.Private:
          return 'private';
        case RecipeType.Awaits:
          return 'awaits';
        case RecipeType.Public:
          return 'public';
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
    this.recipes = [];
    this.loadMoreRecipes();
  }

  private getCurrentUserPlannedRecipes() {
    if (this.currentUserId)
      return this.recipeService.getSomeUserPlannedRecipes(8, 0).pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: 'Вы запланировали эти рецепты',
            link: '/recipes/planned',
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.loadRecipesImages(newRecipes);
          this.blocks.pop();
          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    else return of(null);
  }

  
  private getMyRecipes(i:number) {
    const names: string[] = ['Опубликованные рецепты', 'Ожидающие проверки рецепты', 'Приватные рецепты'];
    const subscribes = [
      this.recipeService.getSomeUserRecipes(8, 0,'public'),
      this.recipeService.getSomeUserRecipes(8, 0,'awaits'),
      this.recipeService.getSomeUserRecipes(8, 0, 'private'),
    ];
    const shortNames = ['public', 'awaits', 'private'];
    if (this.currentUserId)
      return subscribes[i].pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: names[i],
            link: `/recipes/yours/${shortNames[i]}`,
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.loadRecipesImages(newRecipes);
          this.blocks.pop();
          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    else return of(null);
  }


  private getCurrentUserFollowedRecipes() {
    if (this.currentUserId)
      return this.recipeService.getSomeUserFollowedRecipes(8, 0).pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: 'Обновления любимых кулинаров',
            link: '/recipes/updates',
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.blocks.pop();
          this.loadRecipesImages(newRecipes);
          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    else return of(null);
  }
  private getCurrentUserRecipes(): Observable<any> {
    if (this.currentUserId) {
      return this.recipeService.getSomeRecipesByUser(8, 0).pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });

          this.blocks.pop();

          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: 'Ваши рецепты',
            link: '/recipes/yours',
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.loadRecipesImages(newRecipes);
          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    } else {
      return of(null);
    }
  }

  private getFavoriteRecipesOfCurrentUser() {
    if (this.currentUserId)
      return this.recipeService.getSomeUserFavoriteRecipes(8, 0).pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: 'Ваши закладки',
            link: '/recipes/favorite',
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.blocks.pop();
          this.loadRecipesImages(newRecipes);
          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    else return of(null);
  }

  private getLikedRecipesOfCurrentUser() {
    if (this.currentUserId)
      return this.recipeService.getSomeUserLikedRecipes(8, 0).pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });

          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: 'Вам понравились эти рецепты',
            link: '/recipes/liked',
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.blocks.pop();
          this.loadRecipesImages(newRecipes);

          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    else return of(null);
  }

  private getCommentedRecipesOfCurrentUser() {
    if (this.currentUserId)
      return this.recipeService.getSomeUserCommentedRecipes(8, 0).pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });
          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: 'Вы прокомментировали эти рецепты',
            link: '/recipes/commented',
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.blocks.pop();
          this.loadRecipesImages(newRecipes);
          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    else return of(null);
  }

  private getCookedRecipesOfCurrentUser() {
    if (this.currentUserId)
      return this.recipeService.getSomeUserCookedRecipes(8, 0).pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const newRecipes: IRecipe[] = recipes.filter((recipe) => {
            return !this.recipes.some(
              (existingRecipe) => existingRecipe.id === recipe.id,
            );
          });

          const recipesIds = recipes.map((recipe) => recipe.id);
          const group: RecipeGroup = {
            name: 'Вы приготовили эти рецепты',
            link: '/recipes/cooked',
            recipes: recipesIds,
            auth: true,
          };
          this.recipesGroups.push(group);
          this.blocks.pop();
          this.loadRecipesImages(newRecipes);

          this.recipes = [...newRecipes, ...this.recipes];
          this.cd.markForCheck();
        }),
      );
    else return of(null);
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

        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Самые свежие рецепты',
          link: '/recipes/recent',
          recipes: recipesIds,
          auth: false,
        };
        this.recipesGroups.push(group);
        this.blocks.pop();
        this.loadRecipesImages(newRecipes);
        this.recipes = [...newRecipes, ...this.recipes];
        this.cd.markForCheck();
      }),
    );
  }
  private getPopularRecipes() {
    return this.recipeService.getSomePopularRecipes(8, 0).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Популярные рецепты',
          link: '/recipes/best',
          recipes: recipesIds,
          auth: false,
        };
        this.recipesGroups.push(group);

        const newRecipes: IRecipe[] = recipes.filter((recipe) => {
          return !this.recipes.some(
            (existingRecipe) => existingRecipe.id === recipe.id,
          );
        });
        this.blocks.pop();
        this.loadRecipesImages(newRecipes);

        this.recipes = [...newRecipes, ...this.recipes];
        this.cd.markForCheck();
      }),
    );
  }

  getRecipesByGroup(name: string) {
    const group = this.recipesGroups.find((g) => g.name === name);
    if (group) {
      return group.recipes
        .map((recipeId) => this.recipes.find((r) => r.id === recipeId))
        .filter((recipe) => !!recipe) as IRecipe[]; // Фильтруем undefined и приводим к типу Irecipe
    } else return [];
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

        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Комментируют чаще всего',
          link: '/recipes/most-discussed',
          recipes: recipesIds,
          auth: false,
        };
        this.recipesGroups.push(group);
        this.loadRecipesImages(newRecipes);

        this.recipes = [...newRecipes, ...this.recipes];
        this.blocks.pop();
        this.cd.markForCheck();
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
        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Готовят чаще всего',
          link: '/recipes/most-cooked',
          recipes: recipesIds,
          auth: false,
        };
        this.recipesGroups.push(group);
        this.loadRecipesImages(newRecipes);

        this.recipes = [...newRecipes, ...this.recipes];
        this.blocks.pop();
        this.cd.markForCheck();
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
        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Сохраняют чаще всего',
          link: '/recipes/most-favorite',
          recipes: recipesIds,
          auth: false,
        };
        this.recipesGroups.push(group);
        this.loadRecipesImages(recipes);
        this.blocks.pop();

        this.recipes = [...newRecipes, ...this.recipes];
        this.cd.markForCheck();
      }),
    );
  }

  loaded: boolean = false;
  RECIPES_PER_STEP = 8;
  everythingLoaded: boolean = false;
  currentStep = 0;

  loadMoreRecipes() {
    if (this.loaded || !this.recipes.length) {
      this.loaded = false;
      let context: Observable<any> = EMPTY;
      console.log(this.recipeType)

      switch (this.recipeType) {
        case RecipeType.Planning:
          context = this.recipeService.getSomeUserPlannedRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
          );
          break;
        case RecipeType.ByIngredient:
          context = this.recipeService.getSomeRecipesByIngredient(
            this.RECIPES_PER_STEP,
            this.currentStep,
            this.ingredient.id,
          );
          break;
        case RecipeType.Category:
          context = this.recipeService.getSomeRecipesByCategory(
            this.RECIPES_PER_STEP,
            this.currentStep,
            this.category.id,
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

        case RecipeType.Private:
          context = this.recipeService.getSomeUserRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
            'private',
          );
          break;
        case RecipeType.Awaits:
          context = this.recipeService.getSomeUserRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
            'awaits',
          );
          break;
        case RecipeType.Public:
          context = this.recipeService.getSomeUserRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
            'public',
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
          );
          break;
        case RecipeType.Favorite:
          context = this.recipeService.getSomeUserFavoriteRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
          );
          break;
        case RecipeType.Commented:
          context = this.recipeService.getSomeUserCommentedRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
          );
          break;
        case RecipeType.Liked:
          context = this.recipeService.getSomeUserLikedRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
          );
          break;
        case RecipeType.Cooked:
          context = this.recipeService.getSomeUserCookedRecipes(
            this.RECIPES_PER_STEP,
            this.currentStep,
          );
          break;
      }
      this.subscriptions.add(
        context
          .pipe(
            takeUntil(this.destroyed$),
            tap((response: any) => {
              const length: number = response.count;
              const receivedRecipes: IRecipe[] = response.recipes;
              const newRecipes: IRecipe[] = receivedRecipes.filter((recipe) => {
                return !this.recipes.some(
                  (existingRecipe) => existingRecipe.id === recipe.id,
                );
              });

              this.currentStep++;

              this.recipes = [...this.recipes, ...newRecipes];
              this.loaded = true;
              if (length <= this.recipes.length) {
                this.everythingLoaded = true;
              }
              this.loadRecipesImages(newRecipes);
              this.cd.markForCheck();
            }),
          )
          .subscribe());
    }
  }

  private recipeSourceInit(
    categoryFromData: ICategory,
    ingredientFromData: IIngredient,
  ): void {
    if (this.recipeType === RecipeType.Category) {
      this.category = categoryFromData;
      this.subscriptions.add(
        this.categoryService
          .getCategory(this.category.id)
          .pipe(
            takeUntil(this.destroyed$),
            tap((categories: any) => {
              const category = categories[0];
              this.category = category;
              this.title.setTitle(category.name);

              this.startRecipesInit();
            }),
          )
          .subscribe());
      return;
    }

    if (this.recipeType === RecipeType.ByIngredient) {
      this.ingredient = ingredientFromData;
    }

    this.getRecipesOfAllTypes();

    this.title.setTitle(this.getTitleByRecipeType(this.recipeType));
  }

  private currentUserInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((user: IUser) => {
          this.currentUser = user;
        }));
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
    this.subscriptions.unsubscribe();
  }
}
