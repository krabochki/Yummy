import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import {
  IRecipe,
  Ingredient,
  Instruction,
  nullRecipe,
} from '../../../models/recipes';
import { Title } from '@angular/platform-browser';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { ICategory } from '../../../models/categories';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  concatMap,
  filter,
  finalize,
  forkJoin,
  from,
  of,
  takeUntil,
  tap,
} from 'rxjs';
import { CommentService } from '../../../services/comment.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IComment } from '../../../models/comments';
import { getFormattedDate, setReadingTimeInMinutes } from 'src/tools/common';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import {
  INotification,
  nullNotification,
} from 'src/app/modules/user-pages/models/notifications';
import { PlanService } from 'src/app/modules/planning/services/plan.service';
import { nullCalendarEvent } from 'src/app/modules/planning/models/plan';
import {
  ShoppingListItem,
  nullProduct,
} from 'src/app/modules/planning/models/shopping-list';
import { IngredientService } from '../../../services/ingredient.service';
import { RecipeCalendarEvent } from 'src/app/modules/planning/models/calendar';
import { Location } from '@angular/common';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { notifyForFollowersOfApprovedRecipeAuthor } from 'src/app/modules/authentication/components/control-dashboard/notifications';
import { Permission, social } from 'src/app/modules/user-pages/components/settings/conts';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-recipe-page',
  templateUrl: './recipe-page.component.html',
  styleUrls: ['./recipe-page.component.scss'],
  animations: [trigger('history', heightAnim()), trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePageComponent implements OnInit, OnDestroy {
  protected destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();
  protected addingToPlanMode: boolean = false;

  recipe: IRecipe = nullRecipe;

  authorAvatar = '';
  noAvatar = '/assets/images/userpic.png';

  COMMENTS_PER_STEP = 3;
  COMMENTS_STEP = 0;
  commentsLoaded = false;
  everythingLoaded = false;

  categories: ICategory[] = [];
  downRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];

  currentUser: IUser = { ...nullUser };

  basketMode = false;

  noAccessModalShow: boolean = false;
  commentModalShow = false;
  successCommentModalShow = false;

  dataLoaded = false;

  loadingRecipe = { ...nullRecipe, id: -1 };

  showHistory = false;

  readingTimeInMinutes: number = 0;

  commentForm: FormGroup;
  commentText: string = '';
  fb: FormBuilder = new FormBuilder();
  protected linkForSocials = '';

  statisticPercent = 0;

  relatedIngredients: { name: string; id: number; groupId: number }[] = [];
  voteModalShow: boolean = false;
  successVoteModalShow: boolean = false;

  recentRecipesLoading = true;
  alsoFromThisCookLoading = true;
  loading = false;
  showedImages: string[] = [];
  startImageToView = 0;
  recipeLoading = true;

  protected targetCalendarEvent: RecipeCalendarEvent = nullCalendarEvent;
  vote: boolean = false;

  get noPageToGoBack() {
    return window.history.length <= 1;
  }

  get date() {
    return getFormattedDate(this.recipe.publicationDate);
  }

  protected alsoFromThisCook: IRecipe[] = [];

  getRecipesFull(startRecipes: IRecipe[]) {
    const width = window.innerWidth;
    let maxRecipes = 3;
    if (width <= 768) {
      maxRecipes = 2;
    }
    const recipes = [...startRecipes];
    while (recipes.length < maxRecipes) {
      recipes.push(nullRecipe);
    }
    return recipes;
  }

  constructor(
    private notifyService: NotificationService,
    private planService: PlanService,
    private route: ActivatedRoute,
    private titleService: Title,
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private commentService: CommentService,
    public router: Router,
    private ingredientService: IngredientService,
    private cd: ChangeDetectorRef,
    private categoryService: CategoryService,
    private location: Location,
  ) {
    const width = window.innerWidth;

    if (width <= 960) {
      this.recentNumber = 4;
      this.recentSkeleton = Array.from({ length: 4 }, () => this.loadingRecipe);
    }
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

  private getIngredients(recipeId: number) {
    return this.recipeService.getIngredients(recipeId).pipe(
      tap((ingredients: any) => {
        this.recipe.ingredients = ingredients || [];
      }),
    );
  }
  private getInstructions(recipeId: number) {
    return this.recipeService.getInstructions(recipeId).pipe(
      tap((instructions: Instruction[]) => {
        this.recipe.instructions = instructions || [];
      }),
    );
  }

  recentNumber = 3;
  recentSkeleton = Array.from({ length: 3 }, () => this.loadingRecipe);
  alsoFromThisCookNumber = 4;
  alsoFromThisCookSkeleton = Array.from(
    { length: 4 },
    () => this.loadingRecipe,
  );

  private getRecipesFromThisCook() {
    if (this.recipe.authorId && this.recipe.authorId > 0)
      this.subscriptions.add(this.recipeService
        .getSomePublicRecipesByUser(
          this.alsoFromThisCookNumber,
          0,
          this.recipe.authorId,
          this.recipe.id,
        )
        .pipe(takeUntil(this.destroyed$),
          tap((response: any) => {
            const recipes: IRecipe[] = response.recipes;
            this.loadRecipesImages(recipes);

            this.alsoFromThisCookLoading = false;
            this.alsoFromThisCook = recipes;

            this.cd.markForCheck();
          }),
        )
        .subscribe());
  }

  private getRecentRecipes() {
    this.subscriptions.add(
      this.recipeService
        .getSomeMostRecentRecipes(
          this.recentNumber,
          0,
          this.recipe.id,
          this.recipe.authorId,
        )
        .pipe(
          takeUntil(this.destroyed$),
          tap((response: any) => {
            const recipes: IRecipe[] = response.recipes;

            this.loadRecipesImages(recipes);
            this.recentRecipesLoading = false;
            this.recentRecipes = recipes;

            this.cd.markForCheck();
          }),
        )
        .subscribe());
  }

  private loadRecipesImages(recipes: IRecipe[]) {
    recipes.forEach((recipe) => {
      if (recipe.mainImage) {
        recipe.imageLoading = true;

        this.subscriptions.add(
          this.recipeService
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
            .subscribe());
      }
    });
  }

  getSimilarRecipes() {
    this.subscriptions.add(
      this.recipeService
        .getSomeSimilarRecipes(
          this.alsoFromThisCookNumber,
          0,
          this.recipe.id,
          this.recipe.authorId,
        )
        .pipe(
          takeUntil(this.destroyed$),
          tap((response: any) => {
            const recipes: IRecipe[] = response.recipes;

            this.loadRecipesImages(recipes);

            this.similarRecipesLoading = false;
            this.similarRecipes = response.recipes;

            this.cd.markForCheck();
          }),
        )
        .subscribe());
  }

  similarRecipesLoading = true;
  similarRecipes: IRecipe[] = [];

  avatarUrl = '';

  private loadComments() {
    this.recipe.commentsLength = 0;
    this.commentsLoaded = false;
    this.COMMENTS_STEP = 0;
    this.loadMoreComments();
  }

  handleSuccessPublishRecipeModal() {
    this.successPublishModalShow = false;
    this.loadRecipe(this.recipe.id);
  }
  publishRecipe() {
    this.loading = true;
    const publishRecipe$ =
      this.currentUser.role !== 'user'
        ? this.recipeService.approveMyRecipe(this.recipe.id)
        : this.recipeService.makeRecipeAwaits(this.recipe.id);

    publishRecipe$
      .pipe(
        finalize(() => { this.loading = false; this.cd.markForCheck()}),
        tap(() => {
          this.successPublishModalShow = true;
          this.cd.markForCheck();

          if (
            this.userService.getPermission(
              this.currentUser.limitations || [],
              Permission.RecipeSend,
            )
          ) {
            const notify: INotification = this.notifyService.buildNotification(
              this.currentUser.role === 'user'
                ? 'Рецепт отправлен на проверку'
                : 'Рецепт успешно опубликован',
              `Рецепт «${this.recipe.name}» успешно ${
                this.currentUser.role === 'user'
                  ? 'отправлен на проверку'
                  : 'опубликован'
              }`,
              'success',
              'recipe',
              '/recipes/list/' + this.recipe.id,
            );
            this.notifyService
              .sendNotification(notify, this.recipe.authorId, true)
              .subscribe();
          }
          if (this.currentUser.role !== 'user')
            this.sendNotifiesAfterPublishing();
        }),
      )
      .subscribe();
  }

  private sendNotifiesAfterPublishing() {
    this.userService
      .getFollowersIds(this.currentUser.id)
      .pipe(
        tap((response: number[]) => {
          console.log(response)
          const authorFollowers = response;
          const notifyForFollower = notifyForFollowersOfApprovedRecipeAuthor(
            this.currentUser.fullName || `@${this.currentUser.username}`,
            this.recipe,
            this.notifyService,
          );

          const notifications = authorFollowers.map((follower) => {
            return this.userService
              .getLimitation(follower, Permission.RecipeFromFollowing)
              .pipe(
                filter((limit) => !limit),
                tap(() =>
                  this.notifyService.sendNotification(
                    notifyForFollower,
                    follower,
                  ).subscribe()
                ),
              );
          });

          forkJoin(notifications).subscribe();
        }),
      )
      .subscribe();
  }

  loadRecipe(recipeId: number) {
    this.recipeLoading = true;
    this.recentRecipes = [];
    this.categories = [];
    this.similarRecipes = [];
    this.alsoFromThisCook = [];
    this.recentRecipesLoading = true;
    this.alsoFromThisCookLoading = true;
    this.similarRecipesLoading = true;
    this.commentsLoaded = false;
    this.recipe.commentsLength = 0;
    this.authorAvatar = '';
    this.everythingLoaded = false;

    this.showHistory = false;
    this.statisticPercent = 0;

    this.subscriptions.add(
    this.recipeService
      .getRecipe(recipeId)
        .pipe(
        takeUntil(this.destroyed$),
        tap((recipe: IRecipe) => {
          const tRecipe = this.recipeService.translateRecipe(recipe);
          this.recipe = tRecipe;

          const categories$ = this.categoryService
            .getShortCategoriesByRecipe(recipe.id)
            .pipe(
              tap((receivedCategories: ICategory[]) => {
                this.categories = receivedCategories;
              }),
            );

          const statistics$ =
            this.recipe.status === 'public'
              ? this.recipeService.getVotes(this.recipe.id).pipe(
                  tap((response) => {
                    this.recipe.statistics =
                      this.recipeService.translateStatistics(response);
                  }),
                )
              : of(null);

          const ingredients$ = this.getIngredients(this.recipe.id);
          const instructions$ = this.getInstructions(this.recipe.id);

          const instructionsImages$ = this.recipeService
            .getInstructionsImages(this.recipe.id)
            .pipe(
              concatMap((response) => {
                const instructions = response.filter((res) => res); // Фильтрация пустых значений

                return from(instructions).pipe(
                  concatMap((res) => {
                    if (res.image) {
                      

                      return this.recipeService
                        .downloadInstructionImage(res.image)
                        .pipe(
                          catchError(() => {
                            return EMPTY;
                          }), // Обрабатываем ошибку загрузки
                          tap((blob) => {
                            const instruction = this.recipe.instructions.find(
                              (instruction) =>
                                instruction.id === res.instructionId,
                            );
                            if (instruction) {
                              const url = URL.createObjectURL(blob);
                              if (!instruction.images) instruction.images = [];
                             instruction.images.push(url);
                              const data = {
                                url: url,
                                instructionId: res.instructionId,
                              };
                              this.instructionsImages.push(data);
                              this.cd.markForCheck();
                            }
                          }),
                        );
                    } else {
                      return of(null);
                    }
                  }),
                );
              }),
            );

          const relatedIngredients$ = this.getRelatedIngredients();

this.subscriptions.add(          forkJoin([
            categories$,
            ingredients$,
            instructions$,
            statistics$,
            relatedIngredients$,
])
  .pipe(takeUntil(this.destroyed$))
  .subscribe(() => {
            this.recipeInitialize();
            this.loadComments();

            this.getRecipeImage();

            instructionsImages$.subscribe();

            if (this.recipe.avatar) {
              this.subscriptions.add(this.userService
                .downloadUserpic(this.recipe.avatar)
                .pipe(
                  takeUntil(this.destroyed$),
                  tap((blob) => {
                    this.recipe.avatarURL = URL.createObjectURL(blob);
                    this.cd.markForCheck();
                  }),
                  catchError(() => {
                    this.recipe.avatarURL = '';
                    return EMPTY;
                  }),
                )
                .subscribe());
            }

            if (this.recipe.status === 'public') {
              this.getRecentRecipes();
              this.getRecipesFromThisCook();
              this.getSimilarRecipes();
            }
            this.recipeLoading = false;
            this.cd.markForCheck();
          }))
        }),
      )
      .subscribe())
  }

   divideGroup(group:any) {
    const grouped = [];
    let currentGroup:any = null;

    if (group) {
      const ingredients = group;
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        if (ingredient.name.startsWith('!!!')) {
          // Проверяем, есть ли элементы после текущего элемента с "!!!"
          const isLastElement = i === ingredients.length - 1;
          const nextElementIsNotExclamation =
            !isLastElement && !ingredients[i + 1].name.startsWith('!!!');
          if (isLastElement || !nextElementIsNotExclamation) {
            // Если это последний элемент или следующий элемент не нутриент, удаляем "!!!" и добавляем как обычный нутриент
            if (!currentGroup) {
              currentGroup = { title: null, items: [] };
            }
            currentGroup.items.push({
              ...ingredient,
              name: ingredient.name.replace(/^!!!/, ''),
            });
          } else {
            // Если текущая группа пустая, добавляем её в список перед созданием новой группы
            if (currentGroup) {
              grouped.push(currentGroup);
            }
            currentGroup = {
              title: ingredient.name.replace(/^!!!/, ''),
              items: [],
            };
          }
        } else {
          // Если заголовка нет, создаем группу по умолчанию
          if (!currentGroup) {
            currentGroup = { title: null, items: [] };
          }
          currentGroup.items.push(ingredient);
        }
      }
      // Добавляем последнюю группу в список
      if (currentGroup) {
        grouped.push(currentGroup);
      }
    }

    return grouped;

}

  getRecipeImage() {
    if (this.recipe.mainImage) {
      this.recipe.imageLoading = true;
      this.subscriptions.add(
        this.recipeService
          .downloadRecipeImage(this.recipe.mainImage)
          .pipe(
            takeUntil(this.destroyed$),
            catchError(() => {
              return EMPTY;
            }),
            finalize(() => {
              this.recipe.imageLoading = false;
              this.cd.markForCheck();
            }),
            tap((blob) => {
              this.recipe.imageURL = URL.createObjectURL(blob);
            }),
          )
          .subscribe());
    }
  }

  instructionsImages: { url: string; instructionId: number }[] = [];

  private shoppingListInitialize() {
    this.subscriptions.add(
  
    this.planService
      .getProductsByUserId()
        .pipe(
        takeUntil(this.destroyed$),
        tap((shoppingList) => {
          this.currentUserShoppingList = shoppingList;
        }),
      )
        .subscribe());
  }

  init = false;

  private currentUserInitialize() {
    this.subscriptions.add(this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        if (!this.init && receivedUser.id) {
          this.init = true;
          this.shoppingListInitialize();
          if (receivedUser.image) {
            this.subscriptions.add(
              this.userService
                .downloadUserpic(receivedUser.image)
                .pipe(
                  takeUntil(this.destroyed$),
                  tap((blob) => {
                    this.avatarUrl = URL.createObjectURL(blob);
                    this.cd.markForCheck();
                  }),
                  catchError(() => {
                    this.avatarUrl = '';
                    return EMPTY;
                  }),
                )
                .subscribe());
          }
        }
        this.currentUser = receivedUser;
      }));
  }

  private recipeInitialize() {
    this.titleService.setTitle(this.recipe.name);

    this.statisticPercent = Number(this.getStatictics().toFixed(0));

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

    this.setReadingTimeInMinutes();
        this.basketInit();

  }
  protected socials: social[] = [
    'email',
    'telegram',
    'vk',
    'viber',
    'twitter',
    'facebook',
  ];

  ngOnInit() {
    this.currentUserInitialize();
    this.route.data.subscribe((data: Data) => {
      this.linkForSocials = window.location.href;
      const resolverRecipe: IRecipe = data['RecipeResolver'];

      this.loadRecipe(resolverRecipe.id);
    });
  }

  loadMoreComments() {
    if (this.commentsLoaded || !this.recipe.comments.length) {
      this.commentsLoaded = false;
    this.subscriptions.add(  this.commentService
        .getComments(this.recipe.id, this.COMMENTS_PER_STEP, this.COMMENTS_STEP)
      .pipe(
          takeUntil(this.destroyed$),
          tap((response: any) => {
            const count = response.count;
            if (!count) {
              this.commentsLoaded = true;
              this.everythingLoaded = true;
              return;
            }
            const comments: IComment[] = response.comments;

            comments.forEach((comment) => {
              if (comment.avatar) {
                this.subscriptions.add(this.userService
                  .downloadUserpic(comment.avatar)
                  .pipe(
                    takeUntil(this.destroyed$),
                    tap((blob) => {
                      comment.avatarUrl = URL.createObjectURL(blob);
                      this.cd.markForCheck();
                    }),
                    catchError(() => {
                      comment.avatarUrl = '';
                      return EMPTY;
                    }),
                  )
                  .subscribe());
              }
            });

            this.recipe.commentsLength = count;
            this.recipe.comments = [...this.recipe.comments, ...comments];
            if (count <= this.recipe.comments.length) {
              this.everythingLoaded = true;
            }
            this.COMMENTS_STEP++;
            this.commentsLoaded = true;
            this.cd.markForCheck();
          }),
        )
        .subscribe())
    }
  }

  hasIngredientsWithServings(): boolean {
    return this.recipe.ingredients.some((ingredient) => ingredient.quantity);
  }

  handleSuccessVoteModal() {
    const authorId = this.recipe.authorId;
    if (this.recipe.cooked) {
      if (authorId !== this.currentUser.id && authorId > 0) {
        this.userService
          .getLimitation(authorId, Permission.YourRecipeCooked)
          .subscribe((limit) => {
            if (!limit) {
              const notify: INotification =
                this.notifyService.buildNotification(
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
              this.notifyService.sendNotification(notify, authorId).subscribe();
            }
          });
      }
    }

    this.vote = false;

    this.successVoteModalShow = false;
  }
  handlePublishRecipeModal(event: boolean) {
    if (event) {
      this.publishRecipe();
    }
    this.publishModalShow = false;
  }

  successPublishModalShow = false;
  publishModalShow = false;
  deleteRecipe() {
    this.loading = true;

    this.recipeService
      .deleteInstructionsImages(this.recipe.id)
      .pipe(
        tap(() => {
          this.deleteRecipeAndImageAfterInstructionImages();
        }),
      )
      .subscribe();
  }

  deleteRecipeAndImageAfterInstructionImages() {
    this.recipeService
      .deleteRecipeImage(this.recipe.id)
      .pipe(
        tap(() => {
          this.deleteRecipeAfterImage();
        }),
      )
      .subscribe();
  }

  deleteRecipeAfterImage() {
    this.recipeService
      .deleteRecipe(this.recipe.id)
      .pipe(
        tap(() => {
          this.successDeleteModalShow = true;
          this.loading = false;
          this.cd.markForCheck();
          if (this.currentUser.id === this.recipe.authorId) {
            const notify = this.notifyService.buildNotification(
              'Рецепт удален',
              `Вы успешно удалили свой рецепт «${this.recipe.name}».`,
              'success',
              'recipe',
              '',
            );
            this.notifyService
              .sendNotification(
                notify,
                this.recipe.authorId > 0
                  ? this.recipe.authorId
                  : this.currentUser.id,
                true,
              )
              .subscribe();
          } else {
            let notify = nullNotification;
            if (
              this.userService.getPermission(
                this.currentUser.limitations || [],
                Permission.WorkNotifies,
              )
            ) {
              notify = this.notifyService.buildNotification(
                'Рецепт удален',
                `Вы успешно удалили рецепт «${this.recipe.name}».`,
                'success',
                'recipe',
                '',
              );

              this.notifyService
                .sendNotification(notify, this.currentUser.id, true)
                .subscribe();

              if (this.recipe.authorId > 0) {
                notify = this.notifyService.buildNotification(
                  'Ваш рецепт удален',
                  `Ваш ранее опубликованный рецепт «${this.recipe.name}» был удален по решению администратора`,
                  'error',
                  'recipe',
                  '',
                );

                this.notifyService
                  .sendNotification(notify, this.recipe.authorId)
                  .subscribe();
              }
            }
          }
        }),
      )
      .subscribe();
  }

  showRecipeDeleteButton() {
    return this.userService.getPermission(
      this.currentUser.limitations || [],
      Permission.OtherRecipesDeleteButton,
    );
  }

  handleSuccessDeleteModal() {
    this.router.navigateByUrl('/recipes');
  }
  successDeleteModalShow = false;
  editMode = false;

  handleDeleteRecipeModal(event: boolean) {
    if (event) {
      this.deleteRecipe();
    }
    this.deleteRecipeModalShow = false;
  }

  handleEditedRecipe() {
    this.loadRecipe(this.recipe.id);
  }

  deleteRecipeModalShow = false;
  addComment() {
    const comment: IComment = this.commentService.makeComment(
      this.currentUser.id,
      this.commentForm.get('commentText')?.value,
      this.currentUser.fullName || `@${this.currentUser.username}`,
      this.avatarUrl,
    );
    this.loading = true;
    this.commentService
      .postComment(comment, this.recipe)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
        tap((res: any) => {
          const commentId = res.id;
          comment.id = commentId;
          this.recipe.comments = [comment, ...this.recipe.comments];

          this.recipe.commentsLength
            ? this.recipe.commentsLength++
            : (this.recipe.commentsLength = 1);
          this.commentNotifies(comment);
          this.successCommentModalShow = true;
        }),
      )
      .subscribe();
  }

  commentNotifies(comment: IComment) {
    if (
      this.userService.getPermission(
        this.currentUser.limitations || [],
        Permission.YouCommentRecipe,
      )
    ) {
      const notify: INotification = this.notifyService.buildNotification(
        'Комментарий опубликован',
        `Твой комментарий «${comment.text}» успешно опубликован под рецептом «${this.recipe.name}»`,
        'success',
        'comment',
        '/recipes/list/' + this.recipe.id,
      );
      this.notifyService
        .sendNotification(notify, this.currentUser.id, true)
        .subscribe();
    }

    if (
      this.currentUser.id !== this.recipe.authorId &&
      this.recipe.authorId > 0
    ) {
      this.userService
        .getLimitation(this.recipe.authorId, Permission.YourRecipeCommented)
        .subscribe((limit) => {
          if (!limit) {
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
            this.notifyService
              .sendNotification(notify, this.recipe.authorId)
              .subscribe();
          }
        });
    }
  }

  currentUserShoppingList: ShoppingListItem[] = [];

  basketInit(): void {
    this.recipe.ingredients.forEach((ingredient, index) => {
      const matchingProduct = this.currentUserShoppingList.find(
        (product) =>
          product.name === ingredient.name &&
          product.recipeId === this.recipe.id,
      );

      if (matchingProduct) {
        this.recipe.ingredients[index].basket = true;
      }
    });
    this.cd.markForCheck();
  }

  addToBasket( ingredient: Ingredient) {
      const relatedIngredient = this.findIngredientByName(ingredient.name);
      const product: ShoppingListItem = {
        ...nullProduct,
        name: ingredient.name,
        typeId: relatedIngredient?.groupId || 0,
        amount:
          (ingredient.quantity ? ingredient.quantity + ' ' : '') +
          ingredient.unit,
        recipeId: this.recipe.id,
        userId: this.currentUser.id,
      };

      this.loading = true;
      this.cd.markForCheck();

      this.planService
        .postProduct(product)
        .pipe(
          tap((res:any) => {
            const id = res.id;
            product.id = id;
            this.currentUserShoppingList.push(product);
            ingredient.basket = true;
          }),
          finalize(() => {
            this.loading = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    
  }

   removeFromBasket( selectedIngredient: Ingredient) {
    const groceryList = this.currentUserShoppingList;
    const findIndex = groceryList.findIndex(
      (ingr) =>
        ingr.name === selectedIngredient.name &&
        ingr.recipeId === this.recipe.id,
    );
    const findedProduct = groceryList.find(
      (ingredient) =>
        ingredient.name === selectedIngredient.name &&
        ingredient.recipeId === this.recipe.id,
    );

    if (findIndex !== -1 && findedProduct) {
      this.loading = true;
      this.cd.markForCheck();
      this.planService
        .deleteProduct(findedProduct.id)
        .pipe(
          tap(() => {
            groceryList.splice(findIndex, 1);
            this.currentUserShoppingList = groceryList;
            selectedIngredient.basket = false;
          }),
          finalize(() => {
            this.loading = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  makeThisRecipeFavorite() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.recipe.faved = !this.recipe.faved;
    if (this.recipe.faved) {
      this.recipeService
        .pushToFavorites(this.recipe.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.addRecipeToFavorites(this.recipe);
            this.recipe = recipe;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .removeFromFavorites(this.recipe.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.removeRecipeFromFavorites(
              this.recipe,
            );
            this.recipe = recipe;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }

    const authorId = this.recipe.authorId;
    if (this.recipe.faved && authorId > 0 && authorId !== this.currentUser.id) {
      this.userService
        .getLimitation(authorId, Permission.YourRecipeFaved)
        .subscribe((limit) => {
          if (!limit) {
            const title =
              'Твой рецепт «' +
              this.recipe.name +
              '» кто-то добавил в избранное';

            const notify: INotification = this.notifyService.buildNotification(
              'Твой рецепт добавили в избранное',
              title,
              'info',
              'recipe',
              '/recipes/list/' + this.recipe.id,
            );
            this.notifyService.sendNotification(notify, authorId).subscribe();
          }
        });
    }
  }

  likeThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.recipe.liked = !this.recipe.liked;

    if (this.recipe.liked) {
      this.recipeService
        .setLike(this.recipe.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.likeRecipe(this.recipe);
            this.recipe = recipe;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .unsetLike(this.recipe.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.unlikeRecipe(this.recipe);
            this.recipe = recipe;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }

    const authorId = this.recipe.authorId;
    if (
      this.recipe.liked &&
      this.recipe.authorId > 0 &&
      this.recipe.authorId !== this.currentUser.id
    ) {
      this.userService
        .getLimitation(authorId, Permission.YourRecipeLiked)
        .subscribe((limit) => {
          if (!limit) {
            const notify: INotification = this.notifyService.buildNotification(
              'Твой рецепт оценили',
              `Твой рецепт «${this.recipe.name}» понравился кулинару ${
                this.currentUser.fullName
                  ? this.currentUser.fullName
                  : '@' + this.currentUser.username
              }`,
              'info',
              'recipe',
              '/cooks/list/' + this.currentUser.id,
            );
            this.notifyService.sendNotification(notify, authorId).subscribe();
          }
        });
    }
  }

  //готовим рецепт
  cookThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.recipe.cooked = !this.recipe.cooked;

    if (this.recipe.cooked) {
      const subscribes: Observable<any>[] = [];
      subscribes.push(this.recipeService.setCook(this.recipe.id));
      subscribes.push(
        this.recipeService.pushVoteForRecipe(this.recipe.id, this.vote),
      );
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            let recipe = this.recipeService.cookRecipe(this.recipe);
            recipe = this.recipeService.voteForRecipe(this.recipe, this.vote);
            this.recipe = recipe;
            this.statisticPercent = Number(this.getStatictics().toFixed(0));

            this.cd.markForCheck();
          }),
        )
        .subscribe();
    } else {
      const subscribes: Observable<any>[] = [];
      subscribes.push(this.recipeService.removeVoteForRecipe(this.recipe.id));
      subscribes.push(this.recipeService.unsetCook(this.recipe.id));
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            let recipe = this.recipeService.uncookRecipe(this.recipe);
            recipe = this.recipeService.removeVote(this.recipe);
            this.recipe = recipe;
            this.statisticPercent = Number(this.getStatictics().toFixed(0));

            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }

    if (this.recipe.cooked) this.successVoteModalShow = true;
  }
  printRecipe() {
    window.print();
  }

  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  handleCommentModal(answer: boolean) {
    this.commentModalShow = false;
    if (answer) {
      this.addComment();
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

  viewMainImage() {
    if (this.recipe.imageURL) {
      this.startImageToView = 0;
      this.showedImages = [this.recipe.imageURL];
    }
  }

  chooseImagesForViewer(instruction: Instruction, instructionNum: number) {
    this.startImageToView = instructionNum;
    this.showedImages = [...instruction.images];
  }

  imageIndex: number = 0;

  setReadingTimeInMinutes(): void {
    const combinedText = [
      this.recipe.history,
      this.recipe.description,
      ...this.recipe.ingredients.map((ingredient) => ingredient.name),
      ...(this.recipe.nutritions || []).map((ingredient) => ingredient.name),
      ...(this.recipe.instructions || []).map(
        (instruction) => instruction.name,
      ),
    ].join(' ');
    this.readingTimeInMinutes = setReadingTimeInMinutes(combinedText);
  }

  getStatictics(): number {
    if (this.recipe.statistics) {
      const totalVotes =
        this.recipe.statistics.negative + this.recipe.statistics.positive;
      const positiveVotes = this.recipe.statistics.positive;
      const successRate = (positiveVotes / totalVotes) * 100;

      return successRate;
    }
    return 0;
  }
  handleVoteModal(event: boolean) {
    this.vote = event;
    this.cookThisRecipe();

    this.voteModalShow = false;
  }

  findIngredientByName(name: string) {
    const ingredient = this.relatedIngredients.find(
      (ingredient) => ingredient.name === name,
    );
    if (ingredient) {
      return ingredient;
    } else return { name: '', id: 0, groupId: 0 };
  }

  getRelatedIngredients() {
    return this.recipeService.getRelatedIngredients(this.recipe.id).pipe(
      tap((ingredients) => {
        this.relatedIngredients = ingredients;
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }
}
