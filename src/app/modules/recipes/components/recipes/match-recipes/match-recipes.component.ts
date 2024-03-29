/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
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
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { baseComparator, dragEnd, dragStart } from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { getZoom } from 'src/tools/common';
import { IngredientService } from '../../../services/ingredient.service';
import { IIngredient } from '../../../models/ingredients';

@Component({
  selector: 'app-match-recipes',
  templateUrl: './match-recipes.component.html',
  styleUrls: ['./match-recipes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class MatchRecipesComponent implements OnInit, OnDestroy {
  protected baseSvgPath: string = '/assets/images/svg/';
  private categories: ICategory[] = []; //изначальные данные
  private sections: ISection[] = [];
  private recipes: IRecipe[] = [];
  protected group: SectionGroup[] = []; //секции и соответствующие им группы

  protected showIngredientsAutocomplete: boolean = false;

  MAX_NUM_OF_SHOWED_INGREDIENTS = 40;

  //текущий список уникальных ингредиентов, которые есть в подходящих рецептах
  protected uniqueIngredientsArray: { [ingredient: string]: number } = {};

  sectionStates: boolean[] = []; //расскрыты ли категории в секции
  categoryStates: boolean[][] = []; //выбрана ли категория
  protected haveToContainAllCategories: boolean = false; //должен ли рецепт содержать все выбранные категории (или хотя бы одну)

  protected selectedCategories: ICategory[] = [];
  protected selectedIngredients: string[] = [];
  protected excludedIngredients: string[] = [];

  private permanentIngredients: string[] = [];
  private permanentExcludedIngredients: string[] = [];

  protected selectedIngredientsCopyForDragAndDrop: any[] = []; //для cdk drag and drop обычный массив строк не подходит поэтому так
  protected excludedIngredientsCopyForDragAndDrop: any[] = [];

  protected matchingRecipes: IRecipe[] = []; //рецепты подходящие под запросы

  ingredients: IIngredient[] = [];
  protected searchQuery: string = '';
  protected destroyed$: Subject<void> = new Subject<void>();

  @ViewChild('autocompleteBlock') autocomplete?: ElementRef;

  constructor(
    private renderer: Renderer2,
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private ingredientService: IngredientService,
    private sectionService: SectionService,
    private title: Title,
    private router: Router,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) {
    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.autocomplete) {
        if (!this.autocomplete.nativeElement.contains(e.target)) {
          this.showIngredientsAutocomplete = false;
          this.cd.markForCheck();
        }
      }
    });
  }

  ngOnInit(): void {
    this.title.setTitle('Подбор рецептов');
    this.ingredientsInit();

    this.currentUserInit();
    this.recipesInit();
    this.cd.markForCheck();
  }

  ingredientsInit() {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedIngredients: IIngredient[]) =>
          (this.ingredients = receivedIngredients.filter(
            (i) => i.status === 'public',
          )),
      );
  }

  findIngredientByName(name: string): IIngredient {
    return this.ingredientService.findIngredientByName(name, this.ingredients);
  }

  goToMatchingRecipesPage() {
    this.router.navigate(['/recipes/matching'], {
      state: { recipes: this.matchingRecipes },
    });
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
        this.group = [];
        if ((receivedCategories.length > 0)) {
          this.categories = [];
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
          this.sections = [];
              this.group = [];

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
        this.cd.markForCheck();
      });
  }

  private currentUser: IUser = { ...nullUser };
  private currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        if (receivedUser && receivedUser.id > 0) {
          this.currentUser = receivedUser;
          this.permanentIngredients = this.currentUser.permanent || [];
          this.permanentExcludedIngredients = this.currentUser.exclusions || [];

          this.permanentExcludedIngredients.forEach((exclusion) => {
            const matchIngredient = this.findIngredientByName(
              exclusion.toLowerCase().trim(),
            );
            if (matchIngredient.id > 0) {
              const matchIngredientName = matchIngredient.name.toLowerCase();

              const index = this.permanentExcludedIngredients.findIndex((i) => {
                i === exclusion;
              });
              this.permanentExcludedIngredients[index] = matchIngredientName;
            }
          });
          this.permanentIngredients.forEach((permanent) => {
            const matchIngredient = this.findIngredientByName(
              permanent.toLowerCase().trim(),
            );
            if (matchIngredient.id > 0) {
              const matchIngredientName = matchIngredient.name.toLowerCase();
              const index = this.permanentIngredients.findIndex(
                (i) => i === permanent,
              );
              this.permanentIngredients[index] = matchIngredientName;
            }
          });
        }
      });
  }

  recipesInit() {
    //получаем рецепты и все ингредиенты
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes: IRecipe[]) => {
        if (receivedRecipes.length > 0) {
          this.recipes = this.recipeService.getPublicAndAllMyRecipes(
            receivedRecipes,
            this.currentUser.id,
          );
          this.matchingRecipes = this.filterRecipesByIngredients();
          this.uniqueIngredientsArray = this.getUniqueIngredients(this.recipes);
          this.autoIngredients = this.getIngredientNames();
          this.getActualIngredients();
        }
        this.categoriesInit();
      });
  }

  selectIngredient(ingredient: string) {
    // проверяем, есть ли ингредиент уже в selectedIngredients
    if (!this.selectedIngredients.includes(ingredient)) {
      this.selectedIngredients.push(ingredient);

      this.selectedIngredientsCopyForDragAndDrop.push(ingredient);
      const updatedIngredientsObject: { [ingredient: string]: number } = {};
      for (const key in this.uniqueIngredientsArray) {
        if (key !== ingredient) {
          updatedIngredientsObject[key] = this.uniqueIngredientsArray[key];
        }
      }

      this.uniqueIngredientsArray = updatedIngredientsObject;

      this.getActualIngredients();
      this.matchingRecipes = this.filterRecipesByIngredients();
      this.uniqueIngredientsArray = this.getUniqueIngredients(
        this.matchingRecipes,
      );
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
    let ingredientCounts: { [ingredient: string]: number } = {};
    recipes.forEach((recipe) => {
      const checkedIngredients: string[] = [];
      recipe.ingredients.forEach((ingredient) => {
     
          let ingredientName = ingredient.name.toLowerCase().trim();

          //основным считается ингредиент который более специфичен, например Репчатый лук будет именно ингредиентом Репчатый лук, а не Лук,
          //но так как ингредиент лук также включает в себя рецепты с репчатым луком (и вообще любыми луками), нужно добавить это количество рецептов и к нему (если не сделать это то число рецептов будет числом рецептов не включая более специфичные варианты) (то есть если лук например Красный но егго нет в ингредиентах он будет луком ,если есть конкретно красный-то красный )
          const allIngredientsFindedByName = this.findAllIngredientsByName(
            ingredientName,
          ).map((ingredient) => ingredient.name.trim().toLowerCase());

          if (this.findIngredientByName(ingredientName).id > 0) {
            ingredientName = this.findIngredientByName(ingredientName)
              .name.toLowerCase()
              .trim();
          } else {
            //если подходящего ингредиента не существует то добавляем хотя бы само имя ингредиента
            allIngredientsFindedByName.push(
              ingredient.name.toLowerCase().trim(),
            );
        }
        
           const formattedIngredients = this.permanentIngredients.map(
          (ingredient) => ingredient.trim().toLowerCase(),
        );
        const formattedExclusions = this.permanentExcludedIngredients.map(
          (ingredient) => ingredient.trim().toLowerCase(),
        );
        if (
          !allIngredientsFindedByName.some((ingredient) =>
            formattedIngredients.includes(ingredient),
          ) &&
          !allIngredientsFindedByName.some((ingredient) =>
            formattedExclusions.includes(ingredient),
          )
        ) {
        

          const ingredientAlreadyCheckedInThisRecipe =
            allIngredientsFindedByName.some((ingredient) =>
              checkedIngredients.includes(ingredient),
            );

          if (!ingredientAlreadyCheckedInThisRecipe)
            allIngredientsFindedByName.forEach((oneOfIngredients) => {
              if (ingredientCounts[oneOfIngredients] !== undefined) {
                ingredientCounts[oneOfIngredients]++;
              } else {
                ingredientCounts[oneOfIngredients] = 1;
              }
              checkedIngredients.push(oneOfIngredients.toLowerCase().trim());
            });
        }
        
      });
    });
    ingredientCounts = this.onlyNoSelectedIngredients(ingredientCounts);

    return this.sortIngredients(ingredientCounts);
  }

  findAllIngredientsByName(name: string) {
    return this.ingredientService.findAllIngrdientsFitByName(
      name,
      this.ingredients,
    );
  }

  onlyNoSelectedIngredients(ingredientCounts: {
    [ingredient: string]: number;
  }) {
    this.selectedIngredients.forEach((selectedIngredient) => {
      let ingredientName = selectedIngredient.trim().toLowerCase();
      const allIngredientsFindedByName = this.findAllIngredientsByName(
        ingredientName,
      ).map((ingredient) => ingredient.name.trim().toLowerCase());

      if (this.findIngredientByName(ingredientName).id > 0) {
        ingredientName = this.findIngredientByName(ingredientName)
          .name.toLowerCase()
          .trim();
      } else {
        //если подходящего ингредиента не существует то добавляем хотя бы само имя ингредиента
        allIngredientsFindedByName.push(ingredientName.trim());
      }

      allIngredientsFindedByName.forEach((oneOfIngredients) => {
        if (ingredientCounts.hasOwnProperty(oneOfIngredients)) {
          ingredientCounts = Object.fromEntries(
            Object.entries(ingredientCounts).filter(
              ([key]) => key !== oneOfIngredients,
            ),
          );
        }
      });
    });
    this.excludedIngredients.forEach((excludedIngredient) => {
      let ingredientName = excludedIngredient.trim().toLowerCase();
      if (this.findIngredientByName(ingredientName).id > 0) {
        ingredientName = this.findIngredientByName(ingredientName)
          .name.toLowerCase()
          .trim();
      }
      if (ingredientCounts.hasOwnProperty(ingredientName)) {
        ingredientCounts = Object.fromEntries(
          Object.entries(ingredientCounts).filter(
            ([key]) => key !== ingredientName,
          ),
        );
      }
    });
    return ingredientCounts;
  }

  toogleCondition(toogleTo: boolean) {
    this.haveToContainAllCategories = toogleTo;

    this.matchingRecipes = this.filterRecipesByIngredients();
    this.getActualIngredients();
  }

  filterRecipesByIngredients() {
    return this.recipes.filter((recipe) => {
      //чтобы рецепты не фильтровались до 0 если категорий и рецептов не выбрано
      const hasSelectedIngredients = this.selectedIngredients.length > 0;
      const hasSelectedCategories = this.selectedCategories.length > 0;
      const hasExcludedIngredients = this.excludedIngredients.length > 0;

      if (hasSelectedIngredients) {
        const ingredientsCheck = this.selectedIngredients.every(
          (selectedIngredient) => {
            let ingredientMatch = false;
            let nameMatch = false;

            if (this.findIngredientByName(selectedIngredient).id > 0) {
              const variations =
                this.findIngredientByName(selectedIngredient).variations;
              const name = this.findIngredientByName(selectedIngredient)
                .name.toLowerCase()
                .trim();
              nameMatch = recipe.ingredients.some((ingredient) => {
                return ingredient.name.toLowerCase().trim().includes(name);
              });
              variations.forEach((variation) => {
                const vFormat = variation.toLowerCase().trim();
                if (
                  recipe.ingredients.some((ingredient) => {
                    const iFormat = ingredient.name.toLowerCase().trim();
                    return iFormat.includes(vFormat);
                  })
                ) {
                  ingredientMatch = true;
                }
              });
            }

            return (
              recipe.ingredients.some(
                (ingredient) =>
                  ingredient.name.toLowerCase().trim() === selectedIngredient,
              ) ||
              ingredientMatch ||
              nameMatch
            );
          },
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

      if (
        hasExcludedIngredients ||
        this.permanentExcludedIngredients.length > 0
      ) {
        const formattedIngredients = this.permanentExcludedIngredients.map(
          (ingredient) => ingredient.trim().toLowerCase(),
        );
        const fullExclusions = [
          ...formattedIngredients,
          ...this.excludedIngredients,
        ]; //соединяем исключениия пользователя и исключения которые применили сейчас

        const ingredientsCheck = fullExclusions.every((excludedIngredient) => {
          let ingredientMatch = false;

          let nameMatch = false;

          if (this.findIngredientByName(excludedIngredient).id > 0) {
            const variations =
              this.findIngredientByName(excludedIngredient).variations;
            const name = this.findIngredientByName(excludedIngredient)
              .name.toLowerCase()
              .trim();

            nameMatch = recipe.ingredients.some((ingredient) => {
              return ingredient.name.toLowerCase().trim().includes(name);
            });
            variations.forEach((variation) => {
              const vFormat = variation.toLowerCase().trim();
              if (
                recipe.ingredients.some((ingredient) => {
                  const iFormat = ingredient.name.toLowerCase().trim();
                  return vFormat.includes(iFormat) || iFormat.includes(vFormat);
                })
              ) {
                ingredientMatch = true;
              }
            });
          }

          return !(
            recipe.ingredients.some(
              (ingredient) =>
                ingredient.name.toLowerCase().trim() === excludedIngredient,
            ) ||
            ingredientMatch ||
            nameMatch
          );
        });

        if (!ingredientsCheck) {
          return false; // рецепт не подходит под ингредиенты
        }
      }

      return true; // рецепт подходит под все условия
    });
  }

  clearAllIngredients() {
    //убираем все ингредиенты
    this.uniqueIngredientsArray = this.getUniqueIngredients(this.recipes);
    this.selectedIngredients = [];
    this.selectedIngredientsCopyForDragAndDrop = [];
    this.getActualIngredients();
    this.matchingRecipes = this.filterRecipesByIngredients();
  }

  clearAllExcludedIngredients() {
    this.excludedIngredients = [];
    this.excludedIngredientsCopyForDragAndDrop = [];
    this.getActualIngredients();

    this.matchingRecipes = this.filterRecipesByIngredients();
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.selectedIngredients = this.selectedIngredientsCopyForDragAndDrop;
    this.excludedIngredients = this.excludedIngredientsCopyForDragAndDrop;
    this.getActualIngredients();

    this.matchingRecipes = this.filterRecipesByIngredients();
    dragEnd();
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
    const ingredients: string[] = Object.keys(
      this.sortIngredients(this.uniqueIngredientsArray),
    );
    return ingredients;
  }

  // Метод для изменения состояния категории (раскрыть/закрыть)
  toggleCategory(sectionIndex: number, categoryIndex: number, $event: any) {
    this.categoryStates[sectionIndex][categoryIndex] =
      !this.categoryStates[sectionIndex][categoryIndex];

    const selectedCategory = this.group[sectionIndex].categories[categoryIndex];

    if (this.categoryStates[sectionIndex][categoryIndex]) {
      this.selectedCategories.push(selectedCategory);
      // Обновляем список ингредиентов на основе выбранной категории
    } else {
      const index = this.selectedCategories.indexOf(selectedCategory);
      if (index !== -1) {
        this.selectedCategories.splice(index, 1);
      }
    }

    this.updateIngredientsBasedOnCategory(
      selectedCategory,
      this.categoryStates[sectionIndex][categoryIndex],
    );
    $event.preventDefault();
    $event.stopPropagation();
  }

  getZoom(count: number): number {
    return getZoom(count, 0.15, 5, 0.9);
  }

  autocompleteClick(ingredient: string, $event: any) {
    this.showIngredientsAutocomplete = false;
    this.ingredientClick(ingredient, $event);
  }

  ingredientClick(ingredient: string, $event: any) {
    this.selectIngredient(ingredient);
    $event.preventDefault();
    $event.stopPropagation();
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
    let ingredientCounts: { [ingredient: string]: number } = {};

    //сначала берем все ингредиенты подходящие по рецепту вообще
    recipesInSelectedCategory.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        let ingredientName = ingredient.name.toLowerCase().trim();
        if (this.findIngredientByName(ingredientName).id > 0) {
          ingredientName = this.findIngredientByName(ingredientName)
            .name.toLowerCase()
            .trim();
        }
        const allIngredientsFindedByName = this.findAllIngredientsByName(
          ingredientName,
        ).map((ingredient) => ingredient.name.trim().toLowerCase());

        if (this.findIngredientByName(ingredientName).id > 0) {
          ingredientName = this.findIngredientByName(ingredientName)
            .name.toLowerCase()
            .trim();
        } else {
          //если подходящего ингредиента не существует то добавляем хотя бы само имя ингредиента
          allIngredientsFindedByName.push(ingredient.name.toLowerCase().trim());
        }

        allIngredientsFindedByName.forEach((oneOfIngredients) => {
          if (ingredientCounts[oneOfIngredients] !== undefined) {
            ingredientCounts[oneOfIngredients]++;
          } else {
            ingredientCounts[oneOfIngredients] = 1;
          }
        });
      });
    });

    //потом фильтруем выбранные ингредиенты только до тех которые есть в игредиентах выбранных категорий
    if (state) {
      const filteredIngredients = this.selectedIngredients
        .map((ingredient) => ingredient.trim().toLowerCase())
        // eslint-disable-next-line no-prototype-builtins
        .filter((ingredient) => {
          let ingredientName = ingredient;
          if (this.findIngredientByName(ingredient).id > 0) {
            ingredientName = this.findIngredientByName(ingredientName)
              .name.toLowerCase()
              .trim();
          }

          return ingredientCounts.hasOwnProperty(ingredientName);
        });

      this.selectedIngredients = filteredIngredients;
    }

    ingredientCounts = this.onlyNoSelectedIngredients(ingredientCounts);

    if (state) {
      if (this.selectedCategories.length > 1) {
        this.uniqueIngredientsArray = this.sortIngredients({
          ...ingredientCounts,
        });
      } else {
        this.uniqueIngredientsArray = this.sortIngredients(ingredientCounts);
      }
    }
    this.getActualIngredients();

    this.matchingRecipes = this.filterRecipesByIngredients();

    this.uniqueIngredientsArray = this.getUniqueIngredients(
      this.matchingRecipes,
    );
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

  protected dragStart() {
    dragStart();
  }

  toggleSection(sectionIndex: number, $event: any) {
    this.sectionStates[sectionIndex] = !this.sectionStates[sectionIndex];
    $event.preventDefault();
    $event.stopPropagation();
  }

  focusIngredientSearch(): void {
    if (this.searchQuery !== '')
    this.showIngredientsAutocomplete = true;
  }

  protected autoIngredients: string[] = [];
  search(): void {
    const allIngredients = this.getIngredientNames();
    if (this.searchQuery && this.searchQuery !== '') {
            this.showIngredientsAutocomplete = true;

      this.autoIngredients = [];

      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      const filteredIngredients: string[] = allIngredients.filter(
        (ingredient: string) =>
          ingredient.toLowerCase().replace(/\s/g, '').includes(search),
      );

      filteredIngredients.forEach((ingredient) => {
        this.autoIngredients.push(ingredient);
      });
      this.autoIngredients = this.autoIngredients.sort((a,b)=>baseComparator(a,b))
    } else {
      this.showIngredientsAutocomplete = false;
      this.autoIngredients = allIngredients;
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
