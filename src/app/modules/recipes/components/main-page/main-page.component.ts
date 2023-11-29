import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ICategory, ISection } from 'src/app/modules/recipes/models/categories';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ChangeDetectionStrategy } from '@angular/core';
import { SectionService } from '../../services/section.service';
import { Subject, takeUntil } from 'rxjs';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { CategoryService } from '../../services/category.service';
import { Router } from '@angular/router';
import { baseComparator } from 'src/tools/common';
import { IIngredient, IIngredientsGroup } from '../../models/ingredients';
import { IngredientService } from '../../services/ingredient.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal())],
})
export class MainPageComponent implements OnInit, OnDestroy {
  allRecipes: IRecipe[] = [];
  creatingMode = false;
  allSections: ISection[] = [];
  popularRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];
  noAccessModalShow = false;
  categories: ICategory[] = [];
  favoriteRecipes: IRecipe[] = [];
  groups: IIngredientsGroup[] = [];
  cookedRecipes: IRecipe[] = [];
  currentUser: IUser = { ...nullUser };
  popularRecipesLoaded = false;

  userRecipes: IRecipe[] = [];
  MAX_DISPLAY_SIZE = 8;
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private sectionService: SectionService,
    private categoryService: CategoryService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private ingredientService: IngredientService,
    private titleService: Title,
    private authService: AuthService,
  ) {
    this.titleService.setTitle('Yummy');
  }

  ngOnInit(): void {
    this.currentUserInit();
  }

  categoriesInit() {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((categories: ICategory[]) => {
        this.categories = categories;
        this.sectionInit();
      });
  }

  currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((currentUser: IUser) => {
        {
          this.currentUser = currentUser;
          if (this.currentUser.id !== 0) {
            this.userRecipes = this.recipeService
              .getRecipesByUser(this.allRecipes, this.currentUser.id)
              .slice(0, this.MAX_DISPLAY_SIZE);
          }
          this.recipesInit();
        }
      });
  }

  ingredientsInit() {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedIngredients: IIngredient[]) => {
        this.ingredientService.ingredientsGroups$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((receivedGroups: IIngredientsGroup[]) => {
            this.groups = receivedGroups.filter(
              (g) => g.ingredients.length > 0,
            );
            this.groups = this.groups.sort((a, b) =>
              baseComparator(
                this.ingredientService.getRecipesNumberOfGroup(
                  b,
                  receivedIngredients,
                  this.recipeService.getPublicAndAllMyRecipes(
                    this.allRecipes,
                    this.currentUser.id,
                  ),
                ),
                this.ingredientService.getRecipesNumberOfGroup(
                  a,
                  receivedIngredients,
                  this.recipeService.getPublicAndAllMyRecipes(
                    this.allRecipes,
                    this.currentUser.id,
                  ),
                ),
              ),
            ).slice(0,this.MAX_DISPLAY_SIZE);
          });
      });
  }

  clickBannerButton() {
    return this.currentUser.id === 0 ? this.noAccessModalShow = true : null;
  }

  recipesInit() {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((recipes: IRecipe[]) => {
        {
          this.allRecipes = recipes;
          const publicRecipes = this.recipeService.getPublicRecipes(
            this.allRecipes,
          );

          if (this.currentUser.id !== 0) {
            this.userRecipes = this.recipeService
              .getRecipesByUser(this.allRecipes, this.currentUser.id)
              .slice(0, this.MAX_DISPLAY_SIZE);
          }
          if (!this.popularRecipesLoaded && this.allRecipes.length > 0) {
            this.popularRecipes = this.recipeService
              .getPopularRecipes(publicRecipes)
              .slice(0, this.MAX_DISPLAY_SIZE);
            this.popularRecipesLoaded = true;
          }
          this.favoriteRecipes = this.recipeService
            .getMostFavoriteRecipes(publicRecipes)
            .slice(0, this.MAX_DISPLAY_SIZE);
          this.cookedRecipes = this.recipeService
            .getMostCookedRecipes(publicRecipes)
            .slice(0, this.MAX_DISPLAY_SIZE);
          this.recentRecipes = this.recipeService
            .getRecentRecipes(publicRecipes)
            .slice(0, this.MAX_DISPLAY_SIZE);
        }

        this.ingredientsInit();

        this.categoriesInit();
      });
  }

  sectionInit() {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ISection[]) => {
        this.allSections = data;
        this.allSections = this.allSections.sort((a, b) =>
          baseComparator(
            this.sectionService.getNumberRecipesOfSection(
              b,
              this.allRecipes,
              this.categories,
            ),
            this.sectionService.getNumberRecipesOfSection(
              a,
              this.allRecipes,
              this.categories,
            ),
          ),
        );
        this.allSections = this.sectionService
          .getNotEmptySections(this.allSections)
          .slice(0, this.MAX_DISPLAY_SIZE);
        this.cd.markForCheck();
      });
  }

  closeEdit() {
    this.creatingMode = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }
}
