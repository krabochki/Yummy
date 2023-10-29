import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { Title } from '@angular/platform-browser';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { RouteEventsService } from 'src/app/modules/controls/route-events.service';
import { CategoryService } from '../../../services/category.service';
import { ICategory } from '../../../models/categories';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { SectionService } from '../../../services/section.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-recipe-page',
  templateUrl: './recipe-page.component.html',
  styleUrls: ['./recipe-page.component.scss'],
  animations: [trigger('history', heightAnim()), trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePageComponent implements OnInit, OnDestroy {
  protected destroyed$: Subject<void> = new Subject<void>();

  recipe: IRecipe = nullRecipe;

  categories: ICategory[] = [];
  downRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];

  author: IUser = { ...nullUser };
  currentUser: IUser = { ...nullUser };

  iHaveIndgredient: boolean[] = [];
  basket: boolean[] = [];
  basketMode = false;

  isRecipeFavorite: boolean = false;
  isRecipeLiked: boolean = false;
  isRecipeCooked: boolean = false;

  noAccessModalShow: boolean = false;
  successAdminActionModalShow: boolean = false;
  dismissModalShow = false;
  approveModalShow = false;
  adminAction: 'approve' | 'dismiss' = 'dismiss';

  dataLoaded = false;

  showHistory = false;

  
  readingTimeInMinutes: number = 0;

  protected linkForSocials = '';

  constructor(
    private sectionService: SectionService,
    private route: ActivatedRoute,
    private titleService: Title,
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    public router: Router,
    public routerEventsService: RouteEventsService,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;

      });

    this.route.data.subscribe((data: Data) => {
      this.recipe = data['RecipeResolver'];
        this.linkForSocials = window.location.href;

      this.titleService.setTitle(this.recipe.name);

      this.basketInit()
    
      this.userService.users$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          const findedUser = data.find(
            (user) => user.id === this.recipe.authorId,
          );
          if (findedUser) {
            this.author = findedUser;
          }
        });

      this.recipeService.recipes$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((recipes: IRecipe[]) => {
          if (this.recipe.categories.length > 0) {
            const publicRecipes = this.recipeService.getPublicRecipes(recipes);
            this.downRecipes = this.getSimilarRecipes(publicRecipes, 4);
          }
          this.recentRecipes = this.recipeService
            .getRecentRecipes(this.recipeService.getPublicRecipes(recipes))
            .slice(0, 3);
          this.recentRecipes.filter((recipe)=>{recipe.id!==this.recipe.id})
          this.setCategories();
          this.setReadingTimeInMinutes();
          this.setStatistics();
          this.cd.markForCheck();
        });
    });
  }

  setCategories(): void {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((allCategories) => {
        this.categories = allCategories.filter((element) =>
          this.recipe.categories.includes(element.id),
        );
      });
  }

  setStatistics(): void {
    if (this.currentUser.id !== 0) {
      this.isRecipeLiked = this.recipe.likesId.includes(this.currentUser.id);

      this.isRecipeCooked = this.recipe.cooksId.includes(this.currentUser.id);

      this.isRecipeFavorite = this.recipe.favoritesId.includes(
        this.currentUser.id,
      );
    }
  }

  basketInit():void {
      this.iHaveIndgredient = Array.from(
        { length: this.recipe.ingredients.length },
        () => false,
      );
      this.basket = Array.from(
        { length: this.recipe.ingredients.length },
        () => false,
      );
  }

  addToBasket(i: number) {
    this.basket[i] = true;
  }
  removeFromBasket(i: number) {
    this.basket[i] = false;
  }
  getSimilarRecipes(publicRecipes: IRecipe[], maxRecipes: number): IRecipe[] {
    const recipesToAdd: IRecipe[] = [];
    for (const category of this.recipe.categories) {
      const recipesFromCategory = this.recipeService.getRecipesByCategory(
        publicRecipes,
        category,
      );

      for (const newRecipe of recipesFromCategory) {
        if (
          !recipesToAdd.some(
            (existingRecipe) => existingRecipe.id === newRecipe.id,
          ) &&
          newRecipe.id !== this.recipe.id
        ) {
          recipesToAdd.push(newRecipe);
          if (recipesToAdd.length >= maxRecipes) {
            break;
          }
        }
      }

      if (recipesToAdd.length >= maxRecipes) {
        break;
      }
    }

    // Если до сих пор не заполнились то перебираем все рецепты в категориях из секций категорий рецепта
    if (recipesToAdd.length < maxRecipes && this.recipe.categories.length > 0) {
      this.recipe.categories.forEach((element) => {
        const findSection = element;

        this.categoryService.categories$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((cat: ICategory[]) => {
            const category = cat.find((categ) => categ.id === findSection);

            if (category)
              this.sectionService.sections$
                .pipe(takeUntil(this.destroyed$))
                .subscribe((sect) => {
                  const section = this.sectionService.getSectionOfCategory(
                    sect,
                    category,
                  );
                  const sectionCategories =
                    this.categoryService.getCategoriesBySection(section, cat);

                  for (const category of sectionCategories) {
                    const recipesFromCategory =
                      this.recipeService.getRecipesByCategory(
                        publicRecipes,
                        category.id,
                      );

                    for (const newRecipe of recipesFromCategory) {
                      if (
                        !recipesToAdd.some(
                          (existingRecipe) =>
                            existingRecipe.id === newRecipe.id,
                        ) &&
                        newRecipe.id !== this.recipe.id
                      ) {
                        recipesToAdd.push(newRecipe);
                        if (recipesToAdd.length >= maxRecipes) {
                          break;
                        }
                      }
                    }

                    if (recipesToAdd.length >= maxRecipes) {
                      break;
                    }
                  }
                });
          });
      });
    }
    //если все равно нет 4 рецептов то берем популярные
    if (recipesToAdd.length < maxRecipes && this.recipe.categories.length > 0) {
      let popularRecipes = this.recipeService.getPopularRecipes(publicRecipes);

      popularRecipes = popularRecipes.filter(
        (recipe) => recipe.authorId !== this.recipe.authorId,
      );
      for (const newRecipe of popularRecipes) {
        if (
          !recipesToAdd.some(
            (existingRecipe) => existingRecipe.id === newRecipe.id,
          ) &&
          newRecipe.id !== this.recipe.id
        ) {
          recipesToAdd.push(newRecipe);
          if (recipesToAdd.length >= maxRecipes) {
            break;
          }
        }
      }
    }
    return recipesToAdd.slice(0, maxRecipes);
  }

  setReadingTimeInMinutes(): void {
    const combinedText = [
      this.recipe.history,
      this.recipe.description,
      ...this.recipe.ingredients.map((ingredient) => ingredient.name),
      ...this.recipe.nutritions.map((ingredient) => ingredient.name),
      ...this.recipe.instructions.map((instruction) => instruction.name),
    ].join(' ');
    const wordsPerMinute = 200;
    const recipeText = combinedText;
    const words = recipeText.split(/\s+/);
    const wordCount = words.length;
    this.readingTimeInMinutes = Math.ceil(wordCount / wordsPerMinute);
  }

  makeThisRecipeFavorite() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }
    this.isRecipeFavorite = !this.isRecipeFavorite;
    if (this.isRecipeFavorite) {
      this.recipe = this.recipeService.addRecipeToFavorites(
        this.currentUser.id,
        this.recipe,
      );
    } else {
      this.recipe = this.recipeService.removeRecipeFromFavorites(
        this.currentUser.id,
        this.recipe,
      );
    }
    this.recipeService
      .updateRecipe(this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
  }

  likeThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    let updatedRecipe: IRecipe;

    this.isRecipeLiked = !this.isRecipeLiked;

    if (this.isRecipeLiked) {
      updatedRecipe = this.recipeService.likeRecipe(
        this.currentUser.id,
        this.recipe,
      );
    } else {
      updatedRecipe = this.recipeService.unlikeRecipe(
        this.currentUser.id,
        this.recipe,
      );
    }
    this.recipeService
      .updateRecipe(updatedRecipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
  }
  //готовим рецепт
  cookThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeCooked = !this.isRecipeCooked;

    let updatedRecipe: IRecipe;

    if (this.isRecipeCooked) {
      updatedRecipe = this.recipeService.cookRecipe(
        this.currentUser.id,
        this.recipe,
      );
    } else {
      updatedRecipe = this.recipeService.uncookRecipe(
        this.currentUser.id,
        this.recipe,
      );
    }

    this.recipeService
      .updateRecipe(updatedRecipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
  }

  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  handleDismissModal(answer: boolean): void {
    if (answer) {
      this.adminAction = 'dismiss';

      this.successAdminActionModalShow = true;
    }
    this.dismissModalShow = false;
  }
  handleApproveModal(answer: boolean): void {
    if (answer) {
      this.adminAction = 'approve';
      this.successAdminActionModalShow = true;
    }
    this.approveModalShow = false;
  }
  handleSuccessAdminActionModal() {
    if (this.adminAction === 'approve') {
      const approvedRecipe = this.recipeService.approveRecipe(this.recipe);
      this.recipeService.updateRecipe(approvedRecipe).subscribe();
    } else {
      const dismissedRecipe = this.recipeService.dismissRecipe(this.recipe);
      this.recipeService.updateRecipe(dismissedRecipe).subscribe();
    }
    this.router.navigateByUrl('/control-dashboard');

    this.successAdminActionModalShow = false;
  }

  decreasePortions() {
    if (this.recipe.servings > 1) {
      this.recipe.servings--; // Уменьшаем количество порций

      // Пересчитываем количество ингредиентов
      this.recipe.ingredients.forEach((ingredient) => {
        // Пробуем преобразовать количество в число
        const quantityAsNumber = parseFloat(ingredient.quantity);

        // Проверяем, успешно ли преобразование
        if (!isNaN(quantityAsNumber)) {
          // Если успешно, производим пересчет
          ingredient.quantity = Number(
            (
              (quantityAsNumber / (this.recipe.servings + 1)) *
              this.recipe.servings
            ).toFixed(1),
          ).toString();
        }
      });
    }
  }

  // Метод для увеличения порций и пересчета ингредиентов
  increasePortions() {
    this.recipe.servings++; // Уменьшаем количество порций

    // Пересчитываем количество ингредиентов
    this.recipe.ingredients.forEach((ingredient) => {
      // Пробуем преобразовать количество в число
      const quantityAsNumber = parseFloat(ingredient.quantity);

      // Проверяем, успешно ли преобразование
      if (!isNaN(quantityAsNumber)) {
        // Если успешно, производим пересчет
        ingredient.quantity = Number(
          (
            (quantityAsNumber / (this.recipe.servings - 1)) *
            this.recipe.servings
          ).toFixed(1),
        ).toString();
      }
    });
  }

  onSkipHandler() {
    this.router.navigate([this.routerEventsService.previousRoutePath.value]);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
