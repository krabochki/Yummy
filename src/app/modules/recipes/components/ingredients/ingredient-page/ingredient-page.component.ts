import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
} from '../../../models/ingredients';
import { ActivatedRoute } from '@angular/router';
import { IngredientService } from '../../../services/ingredient.service';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe } from '../../../models/recipes';
import { ICategory } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import { Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-ingredient-page',
  templateUrl: './ingredient-page.component.html',
  styleUrls: ['./ingredient-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientPageComponent implements OnInit, OnDestroy {
  ingredient: IIngredient = nullIngredient;
  recipes: IRecipe[] = [];
  showedCategories: ICategory[] = [];
  relatedCategories: ICategory[] = [];
  groups: IIngredientsGroup[] = [];
  relatedIngredients: IIngredient[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  get ingredientGroups() {
    return this.ingredientService
      .getGroupOfIngredient(this.groups, this.ingredient)
      .filter((g) => g.id !== 0);
  }

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private ingredientService: IngredientService,
    private recipeService: RecipeService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.ingredientService.ingredientsGroups$.subscribe(
      (data) => (this.groups = data),
    );
    this.route.data.subscribe((data) => {
      this.ingredient = { ...data['IngredientResolver'] };

      this.titleService.setTitle(this.ingredient.name);

      this.ingredientService.ingredients$
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          (data) =>
            (this.relatedIngredients =
              this.ingredientService.getRelatedIngredients(
                this.ingredient,
                data,
              )),
        );
      this.recipeService.recipes$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.recipes = this.recipeService.getRecipesByIngredient(
            data,
            this.ingredient,
          );
          this.categoryService.categories$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data) => {
              this.relatedCategories =
                this.categoryService.getRelatedCategories(this.recipes, data);
              this.relatedCategories =
                this.categoryService.getPopularCategories(
                  this.relatedCategories,
                  this.recipes,
                );
              this.showedCategories = this.relatedCategories.slice(0, 3);
            });
        });
    });
  }

  showAllCategories() {
    this.showedCategories = this.relatedCategories;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
