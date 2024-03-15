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
import { CategoryService } from '../../../services/category.service';
import { ICategory, nullCategory } from '../../../models/categories';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { EMPTY, Observable, Subject, catchError, concat, concatMap, finalize, forkJoin, of, takeUntil, tap } from 'rxjs';
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
import { CommonModule, Location } from '@angular/common';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { notifyForFollowersOfApprovedRecipeAuthor } from 'src/app/modules/authentication/components/control-dashboard/notifications';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { id } from 'date-fns/locale';
import { getFileFromBlob } from '../recipe-create/consts';

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

  COMMENTS_PER_STEP = 3;
  COMMENTS_STEP = 0;
  commentsLoaded = false;
  everythingLoaded = false;

  categories: ICategory[] = [];
  downRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];

  author: IUser = { ...nullUser };
  currentUser: IUser = { ...nullUser };

  iHaveIndgredient: boolean[] = [];
  basket: boolean[] = [];
  basketMode = false;

  noAccessModalShow: boolean = false;
  commentModalShow = false;
  successCommentModalShow = false;

  dataLoaded = false;

  loadingRecipe = { ...nullRecipe, id: -1 };
  recentSkeleton = Array.from({ length: 3 }, () => this.loadingRecipe);
  alsoFromThisCookSkeleton = Array.from(
    { length: 4 },
    () => this.loadingRecipe,
  );

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
  currentUserId = 0;
  recipes: IRecipe[] = [];
  users: IUser[] = [];
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

  getCategory(categoryId: number) {
    return (
      this.categories.find((category) => category.id === categoryId) ||
      nullCategory
    );
  }

  get authorInfo(): string {
    if (this.author.id <= 0) return 'Автор удален';
    return !this.author.fullName
      ? '@' + this.author.username
      : this.author.fullName;
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

  private getRecipesFromThisCook() {
    this.recipeService
      .getSomePublicRecipesByUser(4, 0, this.recipe.authorId, this.recipe.id)
      .pipe(
        tap((response: any) => {
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
                this.alsoFromThisCookLoading = false;
                this.alsoFromThisCook = response.recipes;

                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();
  }

  private getRecentRecipes() {
    this.recipeService
      .getSomeMostRecentRecipes(3, 0, this.currentUserId, this.recipe.id, this.recipe.authorId)
      .pipe(
        tap((response: any) => {
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
                this.recentRecipesLoading = false;
                this.recentRecipes = response.recipes;

                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();
  }

  getSimilarRecipes() {
    this.recipeService
      .getSomeSimilarRecipes(3, 0, this.recipe.id, this.recipe.authorId)
      .pipe(
        tap((response: any) => {
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
                this.similarRecipesLoading = false;
                this.similarRecipes = response.recipes;

                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();
  }

  similarRecipesLoading = true;
  similarRecipes: IRecipe[] = [];

  getUser(userId: number) {
    return this.users.find((u) => u.id === userId) || nullUser;
  }

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
    const publishRecipe$ =
      this.currentUser.role !== 'user'
        ? this.recipeService.approveRecipe(this.recipe.id)
        : this.recipeService.makeRecipeAwaits(this.recipe.id);

    publishRecipe$
      .pipe(
        tap(() => {
          this.successPublishModalShow = true;
          this.cd.markForCheck();

          //if (
          //   this.userService.getPermission('you-publish-recipe', this.author)
          // ) {
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

          if (this.currentUser.role !== 'user')
            this.sendNotifiesAfterPublishing();

          //   }
        }),
      )
      .subscribe();
  }

  private sendNotifiesAfterPublishing() {
    this.userService
      .getFollowersIds(this.currentUser.id)
      .pipe(
        tap((response: number[]) => {
          const authorFollowers = response;
          const notifyForFollower = notifyForFollowersOfApprovedRecipeAuthor(
            this.currentUser,
            this.recipe,
            this.notifyService,
          );
          const subscribes: Observable<any>[] = [];
          authorFollowers.forEach((follower) => {
            subscribes.push(
              this.notifyService.sendNotification(notifyForFollower, follower),
            );
          });
          forkJoin(subscribes).subscribe();
        }),
      )
      .subscribe();
  }
  loadRecipe(recipeId: number) {
    this.userService.usersSubject.next([]);
    this.recipeService.recipesSubject.next([]);
    this.categoryService.categoriesSubject.next([]);
    this.recipeLoading = true;
    this.recentRecipes = [];
    this.ingredientService.setIngredients([]);
    this.similarRecipes = [];
    this.alsoFromThisCook = [];
    this.recentRecipesLoading = true;
    this.alsoFromThisCookLoading = true;
    this.similarRecipesLoading = true;
    this.commentsLoaded = false;
    this.recipe.commentsLength = 0;
    this.author = nullUser;
    this.authorAvatar = '';
    this.everythingLoaded = false;

    this.showHistory = false;
    this.statisticPercent = 0;

    this.recipeService
      .getRecipe(recipeId, this.currentUserId)
      .pipe(
        tap((recipe: IRecipe) => {
          forkJoin(
            this.recipeService.getRecipeInfo(recipe, true, true),
          ).subscribe(() => {
            const tRecipe = this.recipeService.translateRecipe(recipe);
            this.recipe = tRecipe;
            this.author =
              this.users.find((u) => u.id === this.recipe.authorId) || nullUser;

            const ingredients$ = this.getIngredients(this.recipe.id);
            const instructions$ = this.getInstructions(this.recipe.id);

            const instructionsImages$ = this.recipeService
              .getInstructionsImages(this.recipe.id)
              .pipe(
                concatMap((response) => {
                  const downloadImageObservables = response.map((res) => {
                    if (!res) {
                      // Если в ответе нет изображений, возвращаем пустой Observable
                      return of(null);
                    }

                    if (res.image) {
                      return this.recipeService.downloadImage(res.image).pipe(
                        catchError(()=>{return EMPTY}),
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
                          }
                        }),
                      );
                    } else {
                      return of(null);
                    }
                  });

                  if (!downloadImageObservables.length) {
                    return of(null);
                  } else return concat(...downloadImageObservables);
                }),
              );
            const relatedIngredients$ = this.getRelatedIngredients();

            forkJoin([
              ingredients$,
              instructions$,
              instructionsImages$,
              relatedIngredients$,
            ]).subscribe(() => {
              this.loadComments();

              this.recipeService.addNewRecipe(this.recipe);
              this.recipeService.getRecipeImage(this.recipe);

              if (this.recipe.status === 'public') {
                this.getRecentRecipes();
                this.getRecipesFromThisCook();
                this.getSimilarRecipes();
              }
              this.recipeLoading = false;
              this.cd.markForCheck();
            });
          });
        }),
      )
      .subscribe();
  }

  private categoriesInitialize() {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedCategories: ICategory[]) => {
        this.categories = receivedCategories;
      });
  }

  instructionsImages: { url: string; instructionId: number }[] = [];
  private usersInitialize() {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.users = data;
        if (this.loadCurrentUserAvatar) {
          this.recipeService
            .getAuthorInfo(this.currentUser.id)
            .pipe(
              tap((user: IUser) => {
                this.userService.addUserToUsers(user);
                this.userService.getAvatar(user);
              }),
            )
            .subscribe();
          this.userService.getAvatar(this.getUser(this.currentUser.id));
          this.loadCurrentUserAvatar = false;
        }

        if (this.recipe.authorId > 0) {
          const findedUser = data.find(
            (user) => user.id === this.recipe.authorId,
          );
          this.author = findedUser || { ...this.author, id: -1 };
        }
      });
  }

  private shoppingListInitialize(userId: number) {
    this.planService
      .getProductsByUserId(userId)
      .pipe(
        tap((shoppingList) => {
          this.currentUserShoppingList = shoppingList;
        }),
      )
      .subscribe();
  }

  loadCurrentUserAvatar = false;

  private currentUserInitialize() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        if (receivedUser.id && receivedUser.id !== this.currentUser.id) {
          this.loadCurrentUserAvatar = true;
          this.shoppingListInitialize(receivedUser.id);
        }
        this.currentUser = receivedUser;

        this.usersInitialize();
      });
  }

  private recipesInitialize() {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((recipes: IRecipe[]) => {
        this.recipes = recipes;
        const finded = recipes.find((r) => r.id === this.recipe.id);
        if (finded) this.recipe = finded;
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

        this.basketInit();
        this.setReadingTimeInMinutes();
        this.iHaveIndgredient = Array.from(
          { length: this.recipe.ingredients.length },
          () => false,
        );

        this.cd.markForCheck();
      });
  }

  ngOnInit() {
    this.userService.usersSubject.next([]);
    this.recipeService.recipesSubject.next([]);
    this.categoryService.categoriesSubject.next([]);

    this.categoriesInitialize();
    this.currentUserInitialize();
    this.recipesInitialize();
    this.route.data.subscribe((data: Data) => {
      this.linkForSocials = window.location.href;
      const resolverRecipe: IRecipe = data['RecipeResolver'];

      this.authService.getTokenUser().subscribe((user) => {
        this.currentUserId = user.id;
        this.loadRecipe(resolverRecipe.id);
      });
    });
  }

  loadMoreComments() {
    if (this.commentsLoaded || !this.recipe.comments.length) {
      this.commentsLoaded = false;
      this.commentService
        .getComments(
          this.recipe.id,
          this.currentUser.id,
          this.COMMENTS_PER_STEP,
          this.COMMENTS_STEP,
        )
        .pipe(
          tap((response: any) => {
            console.log(response.comments);
            const count = response.count;
            if (!count) {
              this.commentsLoaded = true;
              this.everythingLoaded = true;
              return;
            }
            const comments: IComment[] = response.comments;
            const comments$: Observable<any>[] = [];
            comments.forEach((comment) => {
              const comment$ = this.recipeService
                .getAuthorInfo(comment.authorId)
                .pipe(
                  tap((user: IUser) => {
                    const findedUser = this.users.find((u) => u.id === user.id);
                    if (findedUser) {
                      this.userService.updateUserInUsers(user);
                    } else {
                      this.userService.addUserToUsers(user);
                    }
                    this.userService.getAvatar(user);
                  }),
                );
              comments$.push(comment$);
            });
            if (!comments$.length) {
              this.commentsLoaded = true;
            }
            forkJoin(comments$)
              .pipe(
                finalize(() => {
                  this.commentsLoaded = true;
                  this.cd.markForCheck();
                }),

                tap(() => {
                  this.recipe.commentsLength = count;
                  this.recipe.comments = [...this.recipe.comments, ...comments];
                  if (count <= this.recipe.comments.length) {
                    this.everythingLoaded = true;
                  }
                  this.COMMENTS_STEP++;
                }),
              )
              .subscribe();
          }),
        )
        .subscribe();
    }
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
    const subscribes$: Observable<any>[] = [];
    if (this.recipe.mainImage) {
      subscribes$.push(this.recipeService.deleteImage(this.recipe.mainImage));
    }
    subscribes$.push(this.recipeService.deleteRecipe(this.recipe.id));
    forkJoin(subscribes$).subscribe(() => {
      this.successDeleteModalShow = true;
      this.loading = false;
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

      this.cd.markForCheck();
    });

    // this.deleteInstuctionPhotos(this.recipe);
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
      this.currentUser,
      this.commentForm.get('commentText')?.value,
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
          this.recipeService.updateRecipeInRecipes(this.recipe);
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

    if (this.currentUser.id !== this.author.id && this.recipe.authorId > 0) {
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
    this.basket = Array.from(
      { length: this.recipe.ingredients.length },
      () => false,
    );
    this.recipe.ingredients.forEach((ingredient, index) => {
      const matchingProduct = this.currentUserShoppingList.find(
        (product) =>
          product.name === ingredient.name &&
          product.recipeId === this.recipe.id,
      );

      if (matchingProduct) {
        this.basket[index] = true;
      }
    });
    this.cd.markForCheck();
  }

  addToBasket(i: number, ingredient: Ingredient) {
    const groceryList = this.currentUserShoppingList;
    const find = this.recipe.ingredients.find(
      (ingr) => ingr.name === ingredient.name,
    );
    if (find) {
      const relatedIngredient = this.findIngredientByName(ingredient.name);
      const product: ShoppingListItem = {
        ...nullProduct,
        name: find.name,
        typeId: relatedIngredient?.groupId || 0,
        amount: (find.quantity ? find.quantity + ' ' : '') + find.unit,
        recipeId: this.recipe.id,
        userId: this.currentUser.id,
      };

      this.loading = true;
      this.cd.markForCheck();

      this.planService
        .postProduct(product)
        .pipe(
          tap(() => {
            this.currentUserShoppingList.push(product);
            this.basket[i] = true;
          }),
          finalize(() => {
            this.loading = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  async removeFromBasket(i: number, selectedIngredient: Ingredient) {
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
            this.basket[i] = false;
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
        .pushToFavorites(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.addRecipeToFavorites(this.recipe);
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .removeFromFavorites(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.removeRecipeFromFavorites(
              this.recipe,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
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
        .setLike(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.likeRecipe(this.recipe);
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .unsetLike(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.unlikeRecipe(this.recipe);
            this.recipeService.updateRecipeInRecipes(recipe);
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
      subscribes.push(
        this.recipeService.setCook(this.recipe.id, this.currentUser.id),
      );
      subscribes.push(
        this.recipeService.pushVoteForRecipe(
          this.recipe.id,
          this.currentUser.id,
          this.vote,
        ),
      );
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            let recipe = this.recipeService.cookRecipe(this.recipe);
            recipe = this.recipeService.voteForRecipe(
              this.recipe,
              this.currentUser.id,
              this.vote,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    } else {
      const subscribes: Observable<any>[] = [];
      subscribes.push(
        this.recipeService.removeVoteForRecipe(
          this.recipe.id,
          this.currentUser.id,
        ),
      );
      subscribes.push(
        this.recipeService.unsetCook(this.recipe.id, this.currentUser.id),
      );
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            let recipe = this.recipeService.uncookRecipe(this.recipe);
            recipe = this.recipeService.removeVote(
              this.recipe,
              this.currentUser.id,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
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
  handleVoteModal(event: boolean) {
    this.vote = event;
    if (event) {
      this.cookThisRecipe();
    }
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
  }
}
