import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe } from '../../../models/recipes';
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
import { Subject, takeUntil } from 'rxjs';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
import { IPlan, nullPlan } from 'src/app/modules/planning/models/plan';
import { baseComparator } from 'src/tools/common';
import { IIngredient, nullIngredient } from '../../../models/ingredients';
import { CategoryService } from '../../../services/category.service';

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
    private authService: AuthService,
    private userService: UserService,
    private title: Title,
    private router: Router,
    private planService: PlanService,
    private categoryService:CategoryService
  ) {
    const matchRecipes =
      this.router.getCurrentNavigation()?.extras.state?.['recipes'];
    if (matchRecipes) {
      this.matchRecipes = matchRecipes;
    }
  }

  protected dataLoad: boolean = false;
  protected creatingMode: boolean = false;
  protected filter: string = '';

  ingredient: IIngredient = nullIngredient;
  protected recipesToShow: IRecipe[] = [];
  protected allRecipes: IRecipe[] = [];

  protected category: ICategory = nullCategory;

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

  categories:ICategory[] = []

  protected currentUser: IUser = { ...nullUser };
  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocomplete: IRecipe[] = [];
  private allUsers: IUser[] = [];
  protected recipeType: RecipeType = RecipeType.All;
  private currentUserPlan: IPlan = nullPlan;

  private destroyed$: Subject<void> = new Subject<void>();

  noAccessModalShow = false;

  ngOnInit(): void {
    this.usersInit();

    this.route.data.subscribe((data) => {
      this.filter = data['filter'];
      if (this.filter === 'matching' && this.matchRecipes.length === 0)
        this.router.navigateByUrl('/recipes');
      this.setRecipeType(this.filter);

      this.currentUserInit(
        data['CategoryResolver'],
        data['IngredientResolver'],
      );

      this.dataLoad = true;
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

  showAuthor(recipe: IRecipe): boolean {
    const author = this.getUser(recipe.authorId);
    return !this.recipeService.hideAuthor(this.currentUser, author);
  }

  private categoryInit(categoryFromData: ICategory, recipes: IRecipe[]): void {

    this.categoryService.categories$.pipe(takeUntil(this.destroyed$)).subscribe(
      (receivedCategories: ICategory[]) => {
        this.categories = receivedCategories.filter(c => c.status === 'public')
      

        const findedCategory = this.categories.find(category => category.id === categoryFromData.id)
        if (findedCategory) {
          this.category = categoryFromData;
        }
        else {
          this.router.navigateByUrl('/sections')
        }

        const publicAndMyRecipes = this.recipeService.getPublicAndAllMyRecipes(
          recipes,
          this.currentUser.id,
        );
        this.allRecipes = this.recipeService.getRecipesByCategory(
          publicAndMyRecipes,
          this.category.id,
        );
        this.recipesToShow = this.allRecipes.slice(0, 8);
      }
    )
   
  }

  private currentUserPlanInit(): void {
    this.planService.plans$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedPlans: IPlan[]) => {
        this.currentUserPlan = this.planService.getPlanByUser(
          this.currentUser.id,
          receivedPlans,
        );
      });
  }

  private getRecipesOfAllTypes(allRecipes: IRecipe[]): void {
    const publicRecipes = this.recipeService.getPublicRecipes(allRecipes);
    const publicAndAllMyRecipes = this.recipeService.getPublicAndAllMyRecipes(
      allRecipes,
      this.currentUser.id,
    );

    this.allRecipes = publicRecipes;
    this.recipesToShow = publicRecipes;

    this.popularRecipes = this.recipeService.getPopularRecipes([
      ...publicRecipes,
    ]);

    this.plannedRecipes = this.recipeService.getPlannedRecipes(
      [...publicAndAllMyRecipes],
      this.currentUserPlan,
    );
    this.discussedRecipes = this.recipeService.getMostDiscussedRecipes([
      ...publicRecipes,
    ]);
    this.commentedRecipes = this.recipeService.getCommentedRecipesByUser(
      [...publicRecipes],
      this.currentUser.id,
    );
    this.mostCooked = this.recipeService.getMostCookedRecipes([
      ...publicRecipes,
    ]);
    this.mostFavorite = this.recipeService.getMostFavoriteRecipes([
      ...publicRecipes,
    ]);
    this.recentRecipes = this.recipeService.getRecentRecipes([
      ...this.allRecipes,
    ]);
    this.cookedRecipes = this.recipeService.getCookedRecipesByUser(
      [...this.allRecipes],
      this.currentUser.id,
    );
    this.likedRecipes = this.recipeService.getLikedRecipesByUser(
      [...this.allRecipes],
      this.currentUser.id,
    );
    this.favoriteRecipes = this.recipeService.getFavoriteRecipesByUser(
      [...this.allRecipes],
      this.currentUser.id,
    );

    this.myRecipes = this.recipeService.getRecipesByUser(
      [...allRecipes],
      this.currentUser.id,
    );

    this.followingRecipes = this.getFollowingRecipes(publicRecipes);
    this.followingRecipes = this.followingRecipes.filter((r) => {
      return this.currentUser.role === 'user' ||
        this.getUser(r.authorId).role === 'admin'
        ? this.userService.getPermission(
            'hide-author',
            this.getUser(r.authorId),
          )
        : true;
    });
  }

  private setRecipesByType(): void {
    switch (this.recipeType) {
      case RecipeType.Planning:
        this.allRecipes = this.plannedRecipes;
        break;
      case RecipeType.Match:
        this.allRecipes = this.matchRecipes;
        break;
      case RecipeType.Discussed:
        this.allRecipes = this.discussedRecipes;
        break;
      case RecipeType.MostCooked:
        this.allRecipes = this.mostCooked;
        break;
      case RecipeType.MostFavorite:
        this.allRecipes = this.mostFavorite;
        break;
      case RecipeType.Popular:
        this.allRecipes = this.popularRecipes;
        break;
      case RecipeType.Updates:
        this.allRecipes = this.followingRecipes;
        break;
      case RecipeType.Recent:
        this.allRecipes = this.recentRecipes;
        break;
      case RecipeType.My:
        this.allRecipes = this.myRecipes;
        break;
      case RecipeType.Favorite:
        this.allRecipes = this.favoriteRecipes;
        break;
      case RecipeType.Commented:
        this.allRecipes = this.commentedRecipes;
        break;
      case RecipeType.Liked:
        this.allRecipes = this.likedRecipes;
        break;
      case RecipeType.Cooked:
        this.allRecipes = this.cookedRecipes;
        break;
      case RecipeType.All:
        this.allRecipes = this.allRecipes.filter(
          (r) => r.authorId !== this.currentUser.id,
        );
        this.allRecipes = [...this.allRecipes, ...this.myRecipes];
        break;
    }
  }
  private sliceAllRecipes(): void {
    this.popularRecipes = this.popularRecipes.slice(0, 8);
    this.plannedRecipes = this.plannedRecipes.slice(0, 8);
    this.recentRecipes = this.recentRecipes.slice(0,8)
    this.discussedRecipes = this.discussedRecipes.slice(0, 8);
    this.mostCooked = this.mostCooked.slice(0, 8);
    this.commentedRecipes = this.commentedRecipes.slice(0, 8);
    this.mostFavorite = this.mostFavorite.slice(0, 8);
    this.cookedRecipes = this.cookedRecipes.slice(0, 8);
    this.likedRecipes = this.likedRecipes.slice(0, 8);
    this.favoriteRecipes = this.favoriteRecipes.slice(0, 8);
    this.myRecipes = this.myRecipes.slice(0, 8);
    this.followingRecipes = this.followingRecipes.slice(0, 8);
  }

  private recipeSourceInit(
    categoryFromData: ICategory,
    ingredientFromData: IIngredient,
  ): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes: IRecipe[]) => {
        console.log(receivedRecipes)
        if (this.recipeType === RecipeType.Category) {
          this.categoryInit(categoryFromData, receivedRecipes);
          return;
        }
        if (this.recipeType === RecipeType.ByIngredient) {
          this.ingredient = ingredientFromData;
          this.allRecipes = this.recipeService.getRecipesByIngredient(
            this.recipeService.getPublicAndAllMyRecipes(
              receivedRecipes,
              this.currentUser.id,
            ),
            ingredientFromData,
          );
          this.recipesToShow = this.allRecipes.slice(0, 8);
        } else {
          this.currentUserPlanInit();
          this.getRecipesOfAllTypes(receivedRecipes);
          this.setRecipesByType();
          if (this.recipeType === RecipeType.All) {
            this.sliceAllRecipes();
          } else {
            this.recipesToShow = this.allRecipes.slice(0, 8);
          }
        }
      });

    this.title.setTitle(this.getTitleByRecipeType(this.recipeType));
  }

  private usersInit(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.allUsers = data;
      });
  }

  private currentUserInit(
    categoryFromData: ICategory,
    ingredientFromData: IIngredient,
  ): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user: IUser) => {
        this.currentUser = user;
        this.recipeSourceInit(categoryFromData, ingredientFromData);
      });
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
      return `Ни один кулинар пока что не создал рецепт с ингредиентом «${this.ingredient.name}». Можете создать рецепт сами или перейти ко всем ингредиентам`;
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

  protected loadMoreRecipes() {
    const currentLength = this.recipesToShow.length;
    const nextRecipes = this.allRecipes.slice(currentLength, currentLength + 4);
    this.recipesToShow = [...this.recipesToShow, ...nextRecipes];
  }

  private getFollowingRecipes(recipes: IRecipe[]): IRecipe[] {
    const currentUserFollowings: IUser[] = this.userService.getFollowing(
      this.allUsers,
      this.currentUser.id,
    );
    let followingRecipes: IRecipe[] = [];

    currentUserFollowings.forEach((following) => {
      let foundRecipes = this.recipeService.getRecipesByUser(
        recipes,
        following.id,
      );
      foundRecipes = this.recipeService.getRecentRecipes(foundRecipes);
      followingRecipes = [...followingRecipes, ...foundRecipes];
    });

    followingRecipes = followingRecipes.sort((a, b) =>
      baseComparator(b.publicationDate, a.publicationDate),
    );

    return followingRecipes;
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

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
