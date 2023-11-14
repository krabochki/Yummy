import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
} from '../../../models/ingredients';
import { ActivatedRoute } from '@angular/router';
import { IngredientService } from '../../../services/ingredient.service';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe, Nutrition } from '../../../models/recipes';
import { ICategory } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import { Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { setReadingTimeInMinutes } from 'src/tools/common';

@Component({
  selector: 'app-ingredient-page',
  templateUrl: './ingredient-page.component.html',
  styleUrls: ['./ingredient-page.component.scss'],
  animations: [trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientPageComponent implements OnInit, OnDestroy {
  ingredient: IIngredient = nullIngredient;
  recipes: IRecipe[] = [];
  showedCategories: ICategory[] = [];

  relatedCategories: ICategory[] = [];
  groups: IIngredientsGroup[] = [];
  relatedIngredients: IIngredient[] = [];
  showHistory = false;
  protected destroyed$: Subject<void> = new Subject<void>();

  get ingredientGroups() {
    return this.ingredientService
      .getGroupOfIngredient(this.groups, this.ingredient)
      .filter((g) => g.id !== 0);
  }

  get nutritionWithContent() {
    return this.ingredient.nutritions?.filter(
      (nutrition) => nutrition.quantity && nutrition.unit,
    );
  }
  get nutritionsWithoutContentText() {
    if (this.ingredient.nutritions) {
      const nutritionsWithoutContent: Nutrition[] =
        this.ingredient.nutritions?.filter(
          (nutrition) => !nutrition.quantity && !nutrition.unit,
        );
      const nutritionsNames = nutritionsWithoutContent.map(
        (item: { name: string }) => item.name.toLowerCase(),
      );
      return nutritionsNames.join(', ');
    } else return '';
  }

  get variations() {
    return this.ingredient.variations.join(', ')
  }

  get showReviewSection() {
    return (
      this.ingredient.advantages ||
      this.ingredient.disadvantages ||
      this.ingredient.recommendedTo ||
      this.ingredient.contraindicatedTo
    );
  }

  get showContentBlock() {
    return (
      this.showMainSection ||
      this.showCookingSection ||
      this.showReviewSection ||
      this.ingredient.tips ||
      this.ingredient.nutritions ||
      this.ingredient.externalLinks
    )
  }
  get showMainSection() {
    return (
      this.ingredient.description ||
      this.ingredient.history ||
      this.ingredient.origin
    );
  }

  get showCookingSection() {
    return (
      this.ingredient.precautions ||
      this.ingredient.cookingMethods ||
      this.ingredient.storageMethods ||
      this.ingredient.compatibleDishes
    );
  }
  
  get readingTimesInMinutes() {
    
    
    const combinedText = [
      this.ingredient.history,
      this.ingredient.description,
      this.ingredient.nutritions?.map((n) => n.name) || [],
      this.ingredient.advantages?.map((a) => a) || [],
      this.ingredient.disadvantages?.map((d) => d) || [],
      this.ingredient.compatibleDishes?.map((c) => c) || [],
      this.ingredient.contraindicatedTo?.map((c) => c) || [],
      this.ingredient.cookingMethods?.map((c) => c) || [],
      this.ingredient.precautions?.map((p) => p) || [],
      this.ingredient.recommendedTo?.map((r) => r) || [],
      this.ingredient.storageMethods?.map((s) => s) || [],
      this.ingredient.tips?.map((t) => t) || [],
    ].join(' ');
    return setReadingTimeInMinutes(combinedText);
  }

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private ingredientService: IngredientService,
    private recipeService: RecipeService,
    private titleService: Title,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.ingredient = { ...data['IngredientResolver'] };

      this.titleService.setTitle(this.ingredient.name);

      this.ingredientService.ingredientsGroups$.subscribe(
        (data) => (this.groups = data),
      );
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
      this.cd.markForCheck();
    });
  }

  goToSection(section: string) {
    const sectionTag = document.getElementById(section);
    if (sectionTag) {
      const headerHeight =
        document.getElementsByClassName('header')[0].clientHeight;
      window.scrollTo({
        top: sectionTag.offsetTop - headerHeight,
        behavior: 'smooth',
      });
    }
  }

  oneColumn(context: 'advantages' | 'recommendations') {
    switch (context) {
      case 'advantages':
        return (
          (this.ingredient.advantages || this.ingredient.disadvantages) &&
          (!this.ingredient.advantages || this.ingredient.disadvantages)
        );
      case 'recommendations':
        return (
          (this.ingredient.recommendedTo ||
            this.ingredient.contraindicatedTo) &&
          (!this.ingredient.recommendedTo || this.ingredient.contraindicatedTo)
        );
    }
  }

  addParagraphs(text: string) {
    return text.replace(/\n/g, '<br>');
  }

  noListStyle(list: any[]) {
    return { 'list-style-type': list.length > 1 ? 'default' : 'none' };
  }

  showAllCategories() {
    this.showedCategories = this.relatedCategories;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
