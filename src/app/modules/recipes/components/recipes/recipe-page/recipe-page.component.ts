import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { IRecipe, Ingredient, Instruction, nullRecipe } from '../../../models/recipes';
import { Title } from '@angular/platform-browser';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { CategoryService } from '../../../services/category.service';
import { ICategory } from '../../../models/categories';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { SectionService } from '../../../services/section.service';
import { Subject, takeUntil } from 'rxjs';
import { CommentService } from '../../../services/comment.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IComment } from '../../../models/comments';
import { getFormattedDate, setReadingTimeInMinutes } from 'src/tools/common';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
import {
  IPlan,
  nullCalendarEvent,
  nullPlan,
} from 'src/app/modules/planning/models/plan';
import {
  ShoppingListItem,
  nullProduct,
} from 'src/app/modules/planning/models/shopping-list';
import { IngredientService } from '../../../services/ingredient.service';
import { IIngredient } from '../../../models/ingredients';
import { RecipeCalendarEvent } from 'src/app/modules/planning/models/calendar';
import { Location } from '@angular/common';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { trimmedMinLengthValidator } from 'src/tools/validators';

@Component({
  selector: 'app-recipe-page',
  templateUrl: './recipe-page.component.html',
  styleUrls: ['./recipe-page.component.scss'],
  animations: [trigger('history', heightAnim()), trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePageComponent implements OnInit, OnDestroy {
  protected destroyed$: Subject<void> = new Subject<void>();

  protected addingToPlanMode: boolean = false;

  recipe: IRecipe = nullRecipe;

  authorAvatar = '';
  noAvatar = '/assets/images/userpic.png';
  currentUserAvatar = '';
  supabase = supabase;

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
  commentModalShow = false;
  successCommentModalShow = false;

  dataLoaded = false;

  showHistory = false;

  readingTimeInMinutes: number = 0;

  commentForm: FormGroup;
  commentText: string = '';
  fb: FormBuilder = new FormBuilder();
  protected linkForSocials = '';

  statisticPercent = 0;

  ingredients: IIngredient[] = [];
  voteModalShow: boolean = false;
  successVoteModalShow: boolean = false;
  commentsToShow: IComment[] = [];

  myPlan: IPlan = nullPlan;
  protected targetCalendarEvent: RecipeCalendarEvent = nullCalendarEvent;
  vote: boolean = false;

  get noPageToGoBack() {
    return window.history.length <= 1;
  }

  get date() {
    return getFormattedDate(this.recipe.publicationDate);
  }

  protected alsoFromThisCook: IRecipe[] = [];

  get hideAuthor(): boolean {
    return this.recipeService.hideAuthor(this.currentUser, this.author);
  }

  get authorInfo(): string {
    if (this.author.id <= 0) return 'Автор удален';
    if (!this.hideAuthor) return 'Автор скрыт';
    return !this.author.fullName
      ? '@' + this.author.username
      : this.author.fullName;
  }

  constructor(
    private notifyService: NotificationService,
    private sectionService: SectionService,
    private planService: PlanService,
    private route: ActivatedRoute,
    private titleService: Title,
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private commentService: CommentService,
    public router: Router,
    private ingredientService: IngredientService,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
    private location: Location,
  ) {
    this.commentForm = this.fb.group({
      commentText: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          trimmedMinLengthValidator(5),
          Validators.maxLength(1000),
        ],
      ],
    });
  }

  ngOnInit() {
    this.route.data.subscribe((data: Data) => {
      this.recipe = data['RecipeResolver'];
      this.linkForSocials = window.location.href;

      this.userService.users$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          if (this.recipe.authorId !== -1) {
            const findedUser = data.find(
              (user) => user.id === this.recipe.authorId,
            );
            if (findedUser) {
              this.author = findedUser;
            }
          } else {
            this.author = { ...nullUser };
            this.author.id = -1;
          }
          this.authService.currentUser$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data: IUser) => {
              this.currentUser = data;

              this.recipeService.recipes$
                .pipe(takeUntil(this.destroyed$))
                .subscribe((recipes: IRecipe[]) => {
                  const finded = recipes.find((r) => r.id === this.recipe.id);
                  if (finded) this.recipe = finded;
                  else {
                    this.router.navigateByUrl('/recipes');
                  }
                  this.cd.markForCheck();
                  this.titleService.setTitle(this.recipe.name);

                  this.ingredientService.ingredients$
                    .pipe(takeUntil(this.destroyed$))
                    .subscribe((receivedIngredients) => {
                      this.ingredients = receivedIngredients.filter(
                        (i) => i.status === 'public',
                      );
                    });

                  this.statisticPercent = Number(
                    this.getStatictics().toFixed(0),
                  );

                  if (this.recipe.categories.length > 0) {
                    const publicRecipes =
                      this.recipeService.getPublicRecipes(recipes);
                    this.downRecipes = this.getSimilarRecipes(publicRecipes, 4);
                  }
                  if (this.hideAuthor && this.author.id > 0) {
                    this.alsoFromThisCook = this.recipeService
                      .getRecipesByUser(
                        this.recipeService.getPublicRecipes(recipes),
                        this.author.id,
                      )
                      .filter((r) => r.id !== this.recipe.id)
                      .slice(0, 4);
                  }
                  this.recentRecipes = this.recipeService.getRecentRecipes(
                    this.recipeService.getPublicRecipes(recipes),
                  );

                  this.recentRecipes = this.recentRecipes.filter(
                    (recipe) => recipe.authorId !== this.currentUser.id,
                  );
                  this.recentRecipes = this.recentRecipes.filter(
                    (recipe) => recipe.id !== this.recipe.id,
                  );
                  this.recentRecipes = this.recentRecipes.slice(0, 3);

                  this.recipe.comments = this.commentService.sortComments([
                    ...this.recipe.comments,
                  ]);
                  if (this.commentsToShow.length > 4)
                    this.commentsToShow = this.recipe.comments.slice(
                      0,
                      this.commentsToShow.length + 1,
                    );
                  else {
                    this.commentsToShow = this.recipe.comments.slice(0, 4);
                  }

                  this.recipe.ingredients.forEach((ingredient) => {
                    const findedIngredient = this.recipe.ingredients.find(
                      (i) => i === ingredient,
                    );
                    if (findedIngredient && findedIngredient.quantity !== '') {
                      findedIngredient.quantity = ingredient.quantity
                        .toString()
                        .replace(',', '.');
                    }
                  });

                  this.downloadAvatars();
                  if (this.recipe.mainImage) {
                    this.downloadPicFromSupabase(this.recipe.mainImage);
                  } else {
                    this.recipe.mainImage = '';
                  }

                  this.setCategories();
                  this.setReadingTimeInMinutes();
                  this.setStatistics();
                  this.iHaveIndgredient = Array.from(
                    { length: this.recipe.ingredients.length },
                    () => false,
                  );

                  this.cd.markForCheck();
                });

              this.planService.plans$
                .pipe(takeUntil(this.destroyed$))
                .subscribe((data) => {
                  const find = data.find((p) => p.user === this.currentUser.id);
                  this.myPlan = find ? find : nullPlan;
                  this.basketInit();
                });
            });
        });
    });
  }

  private getSupabaseLink(path: string) {
    return this.supabase.storage.from('userpics').getPublicUrl(path).data
      .publicUrl;
  }

  downloadAvatars() {
    if (this.currentUser.avatarUrl)
      this.currentUserAvatar = this.getSupabaseLink(this.currentUser.avatarUrl);
    else {
      this.currentUser.avatarUrl = this.noAvatar;
    }
    if (this.author.avatarUrl)
      this.authorAvatar = this.getSupabaseLink(this.author.avatarUrl);
    else this.authorAvatar = this.noAvatar;
    this.cd.markForCheck();
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

  protected addToPlan(): void {
    this.targetCalendarEvent.id = -1;
    this.targetCalendarEvent.recipe = this.recipe.id;
    this.targetCalendarEvent.title = this.recipe.name;
    this.addingToPlanMode = true;
  }

  handleVoteModal(event: boolean) {
    this.vote = event;
    if (event) {
      this.recipe = this.recipeService.voteForRecipe(
        this.recipe,
        this.currentUser.id,
        true,
      );
    } else {
      this.recipe = this.recipeService.voteForRecipe(
        this.recipe,
        this.currentUser.id,
        false,
      );
    }
    this.cookThisRecipe();
    this.voteModalShow = false;
  }

  findIngredientByName(name: string) {
    return this.ingredientService.findIngredientByName(name, this.ingredients);
  }
  async handleSuccessVoteModal() {
    if (this.isRecipeCooked) {
      if (
        this.author.id !== this.currentUser.id &&
        this.userService.getPermission('cook-on-your-recipe', this.author)
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          'Твой рецепт приготовили',
          `Твой рецепт «${this.recipe.name}» приготовил кулинар ${
            this.currentUser.fullName
              ? this.currentUser.fullName
              : '@' + this.currentUser.username
          }${
            this.vote
              ? ' и оставил положительный отзыв'
              : ' и оставил негативный отзыв'
          }`,
          'info',
          'recipe',
          '/cooks/list/' + this.currentUser.id,
        );
        this.notifyService.sendNotification(notify, this.author);
      }
    }

    this.vote = false;

    this.successVoteModalShow = false;
  }

  getStatictics(): number {
    if (this.recipe.statistics && this.recipe.statistics.length > 0) {
      const totalVotes = this.recipe.statistics.length;
      const positiveVotes = this.recipe.statistics.filter(
        (item) => item.answer,
      ).length;
      const successRate = (positiveVotes / totalVotes) * 100;

      return successRate;
    }
    return 0;
  }

  async addComment() {
    const comment: IComment = this.commentService.makeComment(
      this.currentUser,
      this.commentForm.get('commentText')?.value,
    );
    this.loading = true;
    this.cd.markForCheck();
    await this.commentService.addCommentToRecipe(this.recipe, comment);

    if (
      this.userService.getPermission('you-commented-recipe', this.currentUser)
    ) {
      const notify: INotification = this.notifyService.buildNotification(
        'Комментарий опубликован',
        `Твой комментарий «${comment.text}» успешно опубликован под рецептом «${this.recipe.name}»`,
        'success',
        'comment',
        '/recipes/list/' + this.recipe.id,
      );
      await this.notifyService.sendNotification(notify, this.currentUser);
    }

    if (
      this.currentUser.id !== this.author.id &&
      this.userService.getPermission('your-recipe-commented', this.author)
    ) {
      const notify: INotification = this.notifyService.buildNotification(
        'Ваш рецепт прокомментировали',
        `Ваш рецепт «${this.recipe.name}» прокомментировал 
          кулинар ${
            this.currentUser.fullName
              ? this.currentUser.fullName
              : '@' + this.currentUser.username
          }`,
        'info',
        'comment',
        '/recipes/list/' + this.currentUser.id,
      );
      await this.notifyService.sendNotification(notify, this.author);
    }
    this.successCommentModalShow = true;
    this.loading = false;
    this.cd.markForCheck();
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

  basketInit(): void {
    this.basket = Array.from(
      { length: this.recipe.ingredients.length },
      () => false,
    );
    this.recipe.ingredients.forEach((ingredient, index) => {
      const matchingProduct = this.myPlan.shoppingList.find(
        (product) =>
          product.name === ingredient.name &&
          product.relatedRecipe === this.recipe.id,
      );

      if (matchingProduct) {
        this.basket[index] = true;
      }
    });
    this.cd.markForCheck();
  }

  async addToBasket(i: number, ingredient: Ingredient) {
    const groceryList = this.myPlan.shoppingList;
    let maxId = 0;
    if (groceryList.length > 0)
      maxId = Math.max(...groceryList.map((g) => g.id));
    const find = this.recipe.ingredients.find(
      (ingr) => ingr.name === ingredient.name,
    );
    if (find) {
      const relatedIngredient: IIngredient = this.findIngredientByName(
        ingredient.name,
      );

      const product: ShoppingListItem = {
        ...nullProduct,
        id: maxId + 1,
        name: find.name,
        type: relatedIngredient.shoppingListGroup || 0,
        howMuch: (find.quantity ? find.quantity + ' ' : '') + find.unit,
        relatedRecipe: this.recipe.id,
      };
      groceryList.push(product);
      this.myPlan.shoppingList = groceryList;
      this.loading = true;
      this.cd.markForCheck();

      await this.planService.updatePlanInSupabase(this.myPlan);

      this.basket[i] = true;
      this.loading = false;
      this.cd.markForCheck();
    }
  }
  picture = '';
  downloadPicFromSupabase(path: string) {
    this.picture = supabase.storage
      .from('recipes')
      .getPublicUrl(path).data.publicUrl;

    this.cd.markForCheck();
  }

  downloadInstructionPicFromSupabase(path: string) {
    return supabase.storage.from('recipes').getPublicUrl(path).data.publicUrl;
  }

  showedImages:string[] =[];
  startImageToView = 0;

  viewMainImage() {
    this.startImageToView = 0;
    this.showedImages = [this.picture]
  }

  chooseImagesForViewer(instruction: Instruction,instructionNum:number) {
    const images: string[] = [];
    instruction.images.forEach((image: any) => {
      if (image.file) {
        images.push(this.downloadInstructionPicFromSupabase(image.file));
      }
    });
    this.startImageToView = instructionNum;
      this.showedImages = images;

      }

  async removeFromBasket(i: number, ingredient: Ingredient) {
    const groceryList = this.myPlan.shoppingList;
    const findIndex = groceryList.findIndex(
      (ingr) =>
        ingr.name === ingredient.name && ingr.relatedRecipe === this.recipe.id,
    );

    if (findIndex !== -1) {
      groceryList.splice(findIndex, 1);
      this.myPlan.shoppingList = groceryList;
      this.loading = true;
      this.cd.markForCheck();
      await this.planService.updatePlanInSupabase(this.myPlan);
      this.loading = false;
      this.cd.markForCheck();

      this.basket[i] = false;
    }
  }
  loading = false;

  getSimilarRecipes(publicRecipes: IRecipe[], maxRecipes: number): IRecipe[] {
    const recipesToAdd: IRecipe[] = [];
    publicRecipes = publicRecipes.filter(
      (recipe) => recipe.authorId !== this.currentUser.id,
    );
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
    this.readingTimeInMinutes = setReadingTimeInMinutes(combinedText);
  }

  async makeThisRecipeFavorite() {
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

    await this.recipeService.updateRecipeFunction(this.recipe);
    if (this.isRecipeFavorite) {
      if (
        this.author.id !== this.currentUser.id &&
        this.userService.getPermission('fav-on-your-recipe', this.author)
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          'Твой рецепт добавили в избранное',
          `Твой рецепт «${this.recipe.name}» кто-то добавил в избранное`,
          'info',
          'recipe',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService.sendNotification(notify, this.author);
      }
    }
  }

  async likeThisRecipe() {
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
    await this.recipeService.updateRecipeFunction(updatedRecipe);
    if (this.isRecipeLiked) {
      if (this.isRecipeLiked) {
        if (
          this.author.id !== this.currentUser.id &&
          this.userService.getPermission('like-on-your-recipe', this.author)
        ) {
          const notify: INotification = this.notifyService.buildNotification(
            'Твой рецепт оценили',
            `Твой рецепт «${this.recipe.name}» понравился пользователю 
            ${
              this.currentUser.fullName
                ? this.currentUser.fullName
                : '@' + this.currentUser.username
            }`,
            'info',
            'recipe',
            '/cooks/list/' + this.currentUser.id,
          );
          this.notifyService.sendNotification(notify, this.author);
        }
      }
    }
  }
  //готовим рецепт
  async cookThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeCooked = !this.isRecipeCooked;

    if (this.isRecipeCooked) {
      this.recipe = this.recipeService.cookRecipe(
        this.currentUser.id,
        this.recipe,
      );
      await this.recipeService.updateRecipeFunction(this.recipe);

      this.successVoteModalShow = true;
    } else {
      this.recipe = this.recipeService.uncookRecipe(
        this.currentUser.id,
        this.recipe,
      );

      this.recipe = this.recipeService.removeVote(
        this.recipe,
        this.currentUser.id,
      );
      await this.recipeService.updateRecipeFunction(this.recipe);
    }
  }

  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  async handleCommentModal(answer: boolean) {
    this.commentModalShow = false;
    if (answer) {
      await this.addComment();
      this.commentForm.get('commentText')?.setValue('');
      this.commentForm.get('commentText')?.markAsPristine();
      this.commentForm.get('commentText')?.markAsUntouched();
    }
  }
  handleSuccessCommentModal() {
    this.successCommentModalShow = false;
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

  goBack() {
    this.location.back();
  }
  loadMoreComments() {
    const currentLength = this.commentsToShow.length;
    const nextComments = this.recipe.comments.slice(
      currentLength,
      currentLength + 2,
    );
    this.commentsToShow = [...this.commentsToShow, ...nextComments];
  }
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
