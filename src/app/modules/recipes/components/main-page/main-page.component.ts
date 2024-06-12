import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ISection } from 'src/app/modules/recipes/models/categories';
import { IRecipe, RecipeGroup } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ChangeDetectionStrategy } from '@angular/core';
import { SectionService } from '../../services/section.service';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  concatMap,
  finalize,
  from,
  of,
  pipe,
  takeUntil,
  tap,
} from 'rxjs';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Router } from '@angular/router';
import { IGroup } from '../../models/ingredients';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal())],
})
export class MainPageComponent implements OnInit, OnDestroy {
  sections: ISection[] = [];
  groups: IGroup[] = [];
  private recipes: IRecipe[] = [];

  createModal = false;
  accessModal = false;

  currentUser: IUser = { ...nullUser };
  currentUserId = 0;

  loadingGroups = true;
  loadingMostFavoriteRecipes = true;
  sectionsLoaded = false;
  minHorizontalLength = 5;
  protected destroyed$: Subject<void> = new Subject<void>();
  recipesGroups: RecipeGroup[] = [];

  get plannedRecipes() {
    return this.getRecipesByGroup('planned');
  }
  get userRecipes() {
    return this.getRecipesByGroup('yours');
  }

  get mostPopular() {
    return this.getRecipesByGroup('most-popular');
  }
  get recentRecipes() {
    return this.getRecipesByGroup('recent');
  }

  get mostFavorite() {
    return this.getRecipesByGroup('most-favorite');
  }
  get mostCooked() {
    return this.getRecipesByGroup('most-cooked');
  }
  constructor(
    private recipeService: RecipeService,
    private sectionService: SectionService,
    private groupService: GroupService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private authService: AuthService,
  ) {
    this.titleService.setTitle('Yummy');
  }

  ngOnInit(): void {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 768) {
      this.minHorizontalLength = 3;
    } else if (screenWidth <= 1200) {
      this.minHorizontalLength = 4;
    } else {
      this.minHorizontalLength = 5;
    }
    this.currentUserInit();
  }

  getSections() {
    return this.sectionService.getAllAboutSomeNotEmptySections(8, 0).pipe(
      pipe(takeUntil(this.destroyed$)),
      tap((response: any) => {
        const receivedSections: ISection[] = response.results;
        this.sections = receivedSections;
        this.sectionsLoaded = true;

        receivedSections.forEach((section) => {
          if (section.image) {
            section.imageLoading = true;
            if (section.image)
            this.subscriptions.add(  this.sectionService
                .downloadImage(section.image)
                .pipe(
                  takeUntil(this.destroyed$),
                  finalize(() => {
                    section.imageLoading = false;
                    this.cd.markForCheck();
                  }),
                )
                .subscribe((blob) => {
                  section.imageURL = URL.createObjectURL(blob);
                }))
          }
        });
      }),
    );
  }
  private subscriptions: Subscription = new Subscription();

  currentUserInit() {
  this.subscriptions.add(  this.authService
      .getTokenUser()
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser) => {
        this.currentUserId = receivedUser.id;
        const recipes$: Observable<any>[] = [];
        recipes$.push(this.getMostPopularRecipes());
        recipes$.push(this.getSections());

        recipes$.push(this.getMostCookedRecipes());

        recipes$.push(this.getMostFavoriteRecipes());
        recipes$.push(this.getMostRecentRecipes());

        recipes$.push(this.getGroups());
        recipes$.push(this.getCurrentUserRecipes());
        recipes$.push(this.getPlannedFecipes());
            this.subscriptions.add(

        from(recipes$)
          .pipe(
            takeUntil(this.destroyed$),

            concatMap((recipe$) => recipe$.pipe(takeUntil(this.destroyed$))),
            finalize(() => {
              this.cd.markForCheck();
            }),
          )
          .subscribe())
      }))

    this.subscriptions.add(this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((currentUser: IUser) => {
        {
          this.currentUser = currentUser;
        }
      }));
  }

  private getMostFavoriteRecipes() {
    return this.recipeService.getSomeMostFavoriteRecipes(8, 0).pipe(
      takeUntil(this.destroyed$),

      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const recipesIds = recipes.map((recipe) => recipe.id);

        const group: RecipeGroup = {
          name: 'Добавляют в «Закладки» чаще всего',
          auth: false,
          shortName: 'most-favorite',
          link: '/recipes/most-favorite',
          recipes: recipesIds,
        };
        this.favoriteLoading = false;

        this.loadRecipesImages(recipes);

        this.pushGroup(recipes, group);
        this.cd.markForCheck();
      }),
    );
  }
  private getMostRecentRecipes() {
    return this.recipeService.getSomeMostRecentRecipes(8, 0).pipe(
      takeUntil(this.destroyed$),
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          shortName: 'recent',

          name: 'Cамые свежие рецепты',
          auth: false,
          link: '/recipes/recenet',
          recipes: recipesIds,
        };

        this.recentLoading = false;

        this.loadRecipesImages(recipes);
        this.pushGroup(recipes, group);
        this.cd.markForCheck();
      }),
    );
  }
  private getMostCookedRecipes() {
    return this.recipeService.getSomeMostCookedRecipes(8, 0).pipe(
      takeUntil(this.destroyed$),
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Готовят чаще всего',
          auth: false,
          shortName: 'most-cooked',

          link: '/recipes/most-cooked',
          recipes: recipesIds,
        };
        this.mostCookedLoading = false;

        this.loadRecipesImages(recipes);

        this.pushGroup(recipes, group);
        this.cd.markForCheck();
      }),
    );
  }
  private getMostPopularRecipes() {
    return this.recipeService.getSomePopularRecipes(8, 0).pipe(
      takeUntil(this.destroyed$),
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Популярные рецепты',
          auth: false,
          shortName: 'most-popular',

          link: '/recipes/best',
          recipes: recipesIds,
        };

        this.popularLoading = false;

        this.loadRecipesImages(recipes);

        this.pushGroup(recipes, group);
        this.cd.markForCheck();
      }),
    );
  }

  popularLoading = true;

  pushGroup(recipes: IRecipe[], group: RecipeGroup) {
    const newRecipes: IRecipe[] = recipes.filter((recipe) => {
      return !this.recipes.some(
        (existingRecipe) => existingRecipe.id === recipe.id,
      );
    });
    this.recipesGroups.push(group);

    this.recipes = [...newRecipes, ...this.recipes];
  }

  private getPlannedFecipes() {
    if (!this.currentUserId) return of(null);
    return this.recipeService.getSomeUserPlannedRecipes(8, 0).pipe(
      takeUntil(this.destroyed$),
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const recipesIds = recipes.map((recipe) => recipe.id);

        const group: RecipeGroup = {
          name: 'Вы запланировали эти рецепты',
          auth: true,
          shortName: 'planned',

          link: '/recipes/planned',
          recipes: recipesIds,
        };

        this.plannedLoading = false;

        this.loadRecipesImages(recipes);

        this.pushGroup(recipes, group);
        this.cd.markForCheck();
      }),
    );
  }

  plannedLoading = true;

  favoriteLoading = true;
  recentLoading = true;
  mostCookedLoading = true;
  currentUserLoading = true;

  clickBannerButton() {
    return this.currentUser.id === 0 ? (this.accessModal = true) : null;
  }

  getRecipesByGroup(name: string) {
    const group = this.recipesGroups.find((g) => g.shortName === name);
    if (group) {
      return group.recipes
        .map((recipeId) => this.recipes.find((r) => r.id === recipeId))
        .filter((recipe) => !!recipe) as IRecipe[]; // Фильтруем undefined и приводим к типу Irecipe
    } else return [];
  }

  private loadRecipesImages(recipes: IRecipe[]) {
    recipes.forEach((recipe) => {
      if (recipe.mainImage) {
        recipe.imageLoading = true;

     this.subscriptions.add ( this.recipeService
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
          .subscribe())
      }
    });
  }
  private getCurrentUserRecipes() {
    if (!this.currentUserId) return of(null);
    return this.recipeService.getSomeRecipesByUser(8, 0).pipe(
      takeUntil(this.destroyed$),
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const recipesIds = recipes.map((recipe) => recipe.id);
        const group: RecipeGroup = {
          name: 'Ваши рецепты',
          auth: true,
          shortName: 'yours',

          link: '/recipes/yours',
          recipes: recipesIds,
        };

        this.currentUserLoading = false;

        this.loadRecipesImages(recipes);
        this.pushGroup(recipes, group);

        this.cd.markForCheck();
      }),
    );
  }

  getGroups() {
    return this.groupService.getSomeFullGroups(8, 0).pipe(
      takeUntil(this.destroyed$),
      tap((res: any) => {
        const groups: IGroup[] = res.results;
        this.groups = groups;
        groups.forEach((group) => {
          this.loadGroupImage(group);
        });
        this.loadingGroups = false;
        this.cd.markForCheck();
      }),
    );
  }

  loadGroupImage(group: IGroup) {
    if (group.image) {
      group.imageLoading = true;
      if (group.image)
       this.subscriptions.add( this.groupService
          .downloadImage(group.image)
          .pipe(
            takeUntil(this.destroyed$),
            finalize(() => {
              group.imageLoading = false;
              this.cd.markForCheck();
            }),
            tap((blob) => {
              if (blob) {
                group.imageURL = URL.createObjectURL(blob);
              }
            }),
            catchError(() => {
              return EMPTY;
            }),
          )
          .subscribe())
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
   this.subscriptions.unsubscribe()
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.accessModal = false;
  }
}
