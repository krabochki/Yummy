import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RecipeService } from '../../../services/recipe.service';
import { Subject, takeUntil } from 'rxjs';
import { IRecipe } from '../../../models/recipes';
import { CategoryService } from '../../../services/category.service';
import { SectionService } from '../../../services/section.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { SectionGroup } from 'src/app/modules/controls/autocomplete/autocomplete.component';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-match-recipes',
  templateUrl: './match-recipes.component.html',
  styleUrls: ['./match-recipes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class MatchRecipesComponent implements OnInit, OnDestroy {
  protected baseSvgPath: string = '../../../../../assets/images/svg/';
  private categories: ICategory[] = []; //изначальные данные
  private sections: ISection[] = [];
  private recipes: IRecipe[] = [];
  protected group: SectionGroup[] = []; //секции и соответствующие им группы

  //текущий список уникальных ингредиентов, которые есть в подходящих рецептах
  protected uniqueIngredientsArray: { [ingredient: string]: number } = {};

  protected showMatchingRecipes: boolean = false; //расскрыты ли подходящие условию рецепты

  sectionStates: boolean[] = []; //расскрыты ли категории в секции
  categoryStates: boolean[][] = []; //выбрана ли категория
  protected haveToContainAllCategories: boolean = false; //должен ли рецепт содержать все выбранные категории (или хотя бы одну)

  protected selectedCategories: ICategory[] = [];
  protected selectedIngredients: string[] = [];

  protected matchingRecipes: IRecipe[] = []; //рецепты подходящие под запросы

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private sectionService: SectionService,
    private title: Title,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Подбор рецептов');
    this.recipesInit();
    this.categoriesInit();
  }

  getCategory(id: number) {
    return this.categories.find((c) => c.id === id);
  }

  getCategoryRecipesNumber(id: number) {
    return this.recipeService.getRecipesByCategory(this.recipes, id).length;
  }

  categoriesInit() {
    //получаем категории и добавляем в основной обьект только категории с рецептами
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedCategories: ICategory[]) => {
        if (receivedCategories.length > 0) {
          receivedCategories.forEach((category) => {
            if (this.getCategoryRecipesNumber(category.id) > 0)
              this.categories.push(category);
          });
          this.sectionsInit();
        }
      });
  }

  sectionsInit() {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedSections: ISection[]) => {
        if (receivedSections.length > 0) {
          this.sections = receivedSections;

          //создаем обьект sectionGroup соответствующий секции
          this.sections.forEach((section) => {
            if (section.categories.length > 0) {
              const sectionGroup: SectionGroup = {
                section: nullSection,
                categories: [],
              };
              sectionGroup.section = section;
              //берем только публичные категории
              section.categories.forEach((sectionCategoryId: number) => {
                const finded = this.categories.find(
                  (checkedCategory) =>
                    checkedCategory.id === sectionCategoryId &&
                    checkedCategory.status === 'public',
                );
                if (finded) sectionGroup.categories.push(finded);
              });
              //не добавляем секции без категорий с рецептами
              if (sectionGroup.categories.length > 0)
                this.group.push(sectionGroup);
            }
          });
        }
        this.categoryStates = this.group.map((sectionGroup) => {
          return sectionGroup.categories.map(() => false);
        }); //создаем массив со всеми значениями false соответствующий секция-категории
      });
  }

  recipesInit() {
    //получаем рецепты и все ингредиенты
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes: IRecipe[]) => {
        if (receivedRecipes.length > 0) {
          this.recipes = this.recipeService.getPublicRecipes(receivedRecipes);
          this.matchingRecipes = this.recipes;
          this.uniqueIngredientsArray = this.getUniqueIngredients(this.recipes);
        }
      });
  }

  selectIngredient(ingredient: string) {
    // проверяем, есть ли ингредиент уже в selectedIngredients
    if (!this.selectedIngredients.includes(ingredient)) {
      this.selectedIngredients.push(ingredient);
      const updatedIngredientsObject: { [ingredient: string]: number } = {};
      for (const key in this.uniqueIngredientsArray) {
        if (key !== ingredient) {
          updatedIngredientsObject[key] = this.uniqueIngredientsArray[key];
        }
      }
      this.uniqueIngredientsArray = updatedIngredientsObject;
      this.matchingRecipes = this.filterRecipesByIngredients();
    }
  }

  sortIngredients(ingredientCounts: { [ingredient: string]: number }) {
    //сортируем ингредиенты по количеству
    return Object.entries(ingredientCounts)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc: { [ingredient: string]: number }, [ingredient, count]) => {
        acc[ingredient] = count;
        return acc;
      }, {});
  }

  getUniqueIngredients(recipes: IRecipe[]) {
    //получаем ингредиенты рецептов которые подходят под выбранные категории
    const ingredientCounts: { [ingredient: string]: number } = {};
    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const ingredientName = ingredient.name.toLowerCase().trim();
        if (ingredientCounts[ingredientName] !== undefined) {
          ingredientCounts[ingredientName]++;
        } else {
          ingredientCounts[ingredientName] = 1;
        }
      });
    });

    return this.sortIngredients(ingredientCounts);
  }

  toogleCondition(toogleTo: boolean) {
    this.haveToContainAllCategories = toogleTo;
    this.matchingRecipes = this.filterRecipesByIngredients();
  }

  filterRecipesByIngredients() {
    return this.recipes.filter((recipe) => {
      //чтобы рецепты не фильтровались до 0 если категорий и рецептов не выбрано
      const hasSelectedIngredients = this.selectedIngredients.length > 0;
      const hasSelectedCategories = this.selectedCategories.length > 0;

      if (hasSelectedIngredients) {
        const ingredientsCheck = this.selectedIngredients.every(
          (selectedIngredient) =>
            recipe.ingredients.some(
              (ingredient) =>
                ingredient.name.toLowerCase().trim() === selectedIngredient,
            ),
        );

        if (!ingredientsCheck) {
          return false; // рецепт не подходит под ингредиенты
        }
      }

      if (hasSelectedCategories) {
        if (this.haveToContainAllCategories) {
          const categoriesCheck = this.selectedCategories.every(
            (selectedCategory) =>
              recipe.categories.includes(selectedCategory.id),
          );

          if (!categoriesCheck) {
            return false; // рецепт не подходит под все категории
          }
        } else {
          const categoriesCheck = this.selectedCategories.some(
            (selectedCategory) =>
              recipe.categories.includes(selectedCategory.id),
          );

          if (!categoriesCheck) {
            return false; // рецепт не подходит ни под одну категорию
          }
        }
      }

      return true; // рецепт подходит под все условия
    });
  }

  clearAllIngredients() {
    //убираем все ингредиенты
    this.uniqueIngredientsArray = this.getUniqueIngredients(this.recipes);
    this.selectedIngredients = [];
    this.matchingRecipes = this.filterRecipesByIngredients();
    this.getActualIngredients();
  }
  clearAllCategories() {
    this.selectedCategories = [];
    this.categoryStates = this.group.map((sectionGroup) => {
      return sectionGroup.categories.map(() => false);
    });
    this.uniqueIngredientsArray = this.getUniqueIngredients(this.recipes);
    this.matchingRecipes = this.filterRecipesByIngredients();
    this.getActualIngredients();
  }

  getIngredientNames(): string[] {
    return Object.keys(this.uniqueIngredientsArray);
  }

  // Метод для изменения состояния категории (раскрыть/закрыть)
  toggleCategory(sectionIndex: number, categoryIndex: number) {
    this.categoryStates[sectionIndex][categoryIndex] =
      !this.categoryStates[sectionIndex][categoryIndex];

    const selectedCategory = this.group[sectionIndex].categories[categoryIndex];

    if (this.categoryStates[sectionIndex][categoryIndex]) {
      this.selectedCategories.push(selectedCategory);

      // Обновляем список ингредиентов на основе выбранной категории
      this.updateIngredientsBasedOnCategory(selectedCategory, true);
    } else {
      const index = this.selectedCategories.indexOf(selectedCategory);
      if (index !== -1) {
        this.selectedCategories.splice(index, 1);
      }
    }

    this.matchingRecipes = this.filterRecipesByIngredients();
    this.updateIngredientsBasedOnCategory(
      selectedCategory,
      this.categoryStates[sectionIndex][categoryIndex],
    );
  }

  updateIngredientsBasedOnCategory(
    selectedCategory: ICategory,
    state: boolean,
  ) {
    // Фильтруем рецепты, чтобы получить только те, которые принадлежат к выбранной категории
    const recipesInSelectedCategory = this.recipes.filter((recipe) =>
      recipe.categories.includes(selectedCategory.id),
    );

    // Создаем объект для подсчета ингредиентов в выбранной категории
    const ingredientCounts: { [ingredient: string]: number } = {};

    //сначала берем все ингредиенты подходящие по рецепту вообще
    recipesInSelectedCategory.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const ingredientName = ingredient.name.toLowerCase().trim();
        if (ingredientCounts[ingredientName] !== undefined) {
          ingredientCounts[ingredientName]++;
        } else {
          ingredientCounts[ingredientName] = 1;
        }
      });
    });

    //потом фильтруем выбранные ингредиенты только до тех которые есть в игредиентах выбранных категорий
    if (state) {
      const filteredIngredients = this.selectedIngredients
        .map((ingredient) => ingredient.trim().toLowerCase())
        .filter((ingredient) => ingredientCounts.hasOwnProperty(ingredient));

      this.selectedIngredients = filteredIngredients;
    }

    //теперь фильтруем возможные ингредиенты убирая ингредиенты которые есть в списке выбранных

    recipesInSelectedCategory.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        //не добавляем во все ингредиенты те ингредиенты, которые уже выбраны
        if (
          !this.selectedIngredients.includes(
            ingredient.name.trim().toLowerCase(),
          )
        ) {
          const ingredientName = ingredient.name.toLowerCase().trim();
          if (ingredientCounts[ingredientName] !== undefined) {
            ingredientCounts[ingredientName]++;
          } else {
            ingredientCounts[ingredientName] = 1;
          }
        }
      });
    });

    if (state) {
      if (this.selectedCategories.length > 1) {
        this.uniqueIngredientsArray = this.sortIngredients({
          ...this.uniqueIngredientsArray,
          ...ingredientCounts,
        });
      } else {
        this.uniqueIngredientsArray = this.sortIngredients(ingredientCounts);
      }
    } else {
      this.getActualIngredients();
    }
  }

  getActualIngredients() {
    if (
      this.matchingRecipes.length === 0 ||
      this.selectedCategories.length === 0 ||
      this.selectedIngredients.length > 0
    ) {
      // Если пользователь убирает категорию но кроме нее остается еще другая, и при этом выбраны ингредиенты по которым не совпадений среди рецептов, рецепты сначала фильтруются по выбранным категориям не учитывая рецепты
      const buferIngredients = [...this.selectedIngredients];
      this.selectedIngredients = [];
      this.matchingRecipes = this.filterRecipesByIngredients();
      this.selectedIngredients = buferIngredients;
    }
    const updatedIngredients: { [ingredient: string]: number } =
      this.getUniqueIngredients(this.matchingRecipes);
    this.uniqueIngredientsArray = updatedIngredients;
  }

  toggleSection(sectionIndex: number) {
    this.sectionStates[sectionIndex] = !this.sectionStates[sectionIndex];
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
