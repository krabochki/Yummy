import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ISection } from 'src/app/modules/recipes/models/categories';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
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
  catchError,
  finalize,
  forkJoin,
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

  recentRecipes: IRecipe[] = [];
  mostCooked: IRecipe[] = [];
  mostFavorite: IRecipe[] = [];
  userRecipes: IRecipe[] = [];
  mostPopular: IRecipe[] = [];
  plannedRecipes: IRecipe[] = [];

  currentUser: IUser = { ...nullUser };
  private currentUserId = 0;

  loadingPopularRecipes = true;
  loadingRecentRecipes = true;
  loadingMostCookedRecipes = true;
  loadingCurentUserRecipes = true;
  loadingPlannedRecipes = true;
  loadingGroups = true;
  loadingMostFavoriteRecipes = true;
  sectionsLoaded = false;
  minHorizontalLength = 5;
  protected destroyed$: Subject<void> = new Subject<void>();

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
    this.sectionService.setSections([]);
    this.recipeService.recipesSubject.next([]);
    this.groupService.setGroups([]);
    this.currentUserInit();
  }

  getSections() {
    this.sectionService
      .getAllAboutSomeNotEmptySections(8, 0, this.currentUserId)
      .subscribe((response: any) => {
        this.sectionsLoaded = true;
        const receivedSections: ISection[] = response.results;
        this.sectionService.setSections(receivedSections);
        receivedSections.forEach((section) => {
          if (section.image) {
            section.imageLoading = true;
            this.sectionService.updateSectionInSection(section);
            this.cd.markForCheck();
            if (section.image)
              this.sectionService
                .downloadImage(section.image)
                .pipe(
                  finalize(() => {
                    section.imageLoading = false;
                    this.sectionService.updateSectionInSection(section);
                    this.cd.markForCheck();
                  }),
                )
                .subscribe((blob) => {
                  section.imageURL = URL.createObjectURL(blob);
                  this.cd.markForCheck();
                });
          }
        });
      });
  }

  currentUserInit() {
    this.authService.getTokenUser().subscribe((receivedUser) => {
      this.currentUserId = receivedUser.id;
      this.getSections();

      this.getGroups();
      this.recipesInit();
    });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((currentUser: IUser) => {
        {
          this.currentUser = currentUser;
        }
      });
  }

  private getMostFavoriteRecipes() {
    return this.recipeService.getSomeMostFavoriteRecipes(8, 0, this.currentUserId).pipe(
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
  private getMostRecentRecipes() {
    return this.recipeService.getSomeMostRecentRecipes(8, 0, this.currentUserId).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const subscribes = this.getMoreRecipesData(recipes);
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
  private getMostCookedRecipes() {
    return this.recipeService.getSomeMostCookedRecipes(8, 0,this.currentUserId).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const subscribes = this.getMoreRecipesData(recipes);
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
  private getMostPopularRecipes() {
    return this.recipeService.getSomePopularRecipes(8, 0, this.currentUserId).pipe(
      tap((response) => {
        const recipes: IRecipe[] = response.recipes;
        const subscribes = this.getMoreRecipesData(recipes);
        forkJoin(subscribes)
          .pipe(
            finalize(() => {
              this.loadingPopularRecipes = false;
              this.mostPopular = recipes;

              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }),
    );
  }

  getMoreRecipesData(recipes: IRecipe[]) {
    const newRecipes: IRecipe[] = recipes.filter((recipe) => {
      return !this.recipes.some(
        (existingRecipe) => existingRecipe.id === recipe.id,
      );
    });
    newRecipes.forEach((recipe) => {
      recipe = this.recipeService.translateRecipe(recipe);
      this.recipeService.addNewRecipe(recipe);
    });

    return this.recipeService.getRecipesInfo(newRecipes, true);
  }
  private getPlannedFecipes() {
    return this.recipeService
      .getSomeUserPlannedRecipes(8, 0, this.currentUserId)
      .pipe(
        tap((response) => {
          const recipes: IRecipe[] = response.recipes;
          const subscribes = this.getMoreRecipesData(recipes);
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

  clickBannerButton() {
    return this.currentUser.id === 0 ? (this.accessModal = true) : null;
  }

  updateRecipes() {
    this.loadingCurentUserRecipes = true;
    this.userRecipes = [];
    this.recentRecipes = [];
    this.loadingRecentRecipes = true;
    const withAuth$: Observable<any>[] = [];
    withAuth$.push(this.getCurrentUserRecipes());
    withAuth$.push(this.getMostRecentRecipes());
    forkJoin(withAuth$).subscribe();
  }

  recipesInit() {
    const recipes$: Observable<any>[] = [];
    recipes$.push(this.getMostCookedRecipes());
    recipes$.push(this.getMostFavoriteRecipes());
    recipes$.push(this.getMostRecentRecipes());
    recipes$.push(this.getMostPopularRecipes());
    if (this.currentUserId) {
      recipes$.push(this.getPlannedFecipes());
      recipes$.push(this.getCurrentUserRecipes());
    }
    forkJoin(recipes$).subscribe();

    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((recipes: IRecipe[]) => {
        {
          this.recipes = recipes;
        }
        this.groupsInit();
        this.sectionsInit();
      });
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
                this.loadingCurentUserRecipes = false;
                this.userRecipes = recipes;
                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      );
  }

  private sectionsInit(): void {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ISection[]) => {
        this.sections = JSON.parse(JSON.stringify(data));

        this.cd.markForCheck();
      });
  }

  private groupsInit(): void {
    this.groupService.groups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedGroups: IGroup[]) => {
        this.groups = receivedGroups;
      });
  }

  getGroups() {
    this.groupService
      .getSomeFullGroups(8, 0, this.currentUserId)
      .subscribe((res: any) => {
        const groups: IGroup[] = res.results;
        groups.forEach((group) => {
          this.groupService.addGroupToGroups(group);
          this.loadGroupImage(group);
        });

        this.loadingGroups = false;

        this.cd.markForCheck();
      });
  }

  loadGroupImage(group: IGroup) {
    if (group.image) {
      group.imageLoading = true;
      this.groupService.updateGroup(group);
      if (group.image)
        this.groupService
          .downloadImage(group.image)
          .pipe(
            finalize(() => {
              group.imageLoading = false;
              this.groupService.updateGroupInGroups(group);
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
          .subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.accessModal = false;
  }
}
