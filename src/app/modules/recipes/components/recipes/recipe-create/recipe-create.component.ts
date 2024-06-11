/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  AbstractControl,
  FormControl,
} from '@angular/forms';
import {
  steps,
  Step,
  noValidStepDescription,
  getFileFromBlob,
  notifyForEditedRecipeAuthor,
  getRecipeByForm,
} from './consts';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { IRecipe, Instruction, nullRecipe } from '../../../models/recipes';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ICategory } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  combineLatest,
  forkJoin,
  from,
  of,
} from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  finalize,
  last,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  addModalStyle,
  removeModalStyle,
} from 'src/tools/common';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { notifyForFollowersOfApprovedRecipeAuthor } from 'src/app/modules/authentication/components/control-dashboard/notifications';
import {
  customPatternValidator,
  notOnlyGroupDivider,
  trimmedMinLengthValidator,
} from 'src/tools/validators';
import { numbers } from 'src/tools/regex';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import {
  compareCategories,
  compareIngredients,
  compareInstructions,
  postInstruction,
} from './compare';
import { checkFile } from 'src/tools/error.handler';

@Component({
  selector: 'app-recipe-create',
  templateUrl: './recipe-create.component.html',
  styleUrls: ['../../../../styles/forms.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCreateComponent implements OnInit, OnDestroy {
  @ViewChild('input', { static: false }) input: ElementRef | undefined;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() updatedRecipeEmitter = new EventEmitter<boolean>();
  @Input() editedRecipe: IRecipe = { ...nullRecipe };

  @HostListener('window:beforeunload')
  canDeactivate() {
      
    if (this.areObjectsEqual())
      return confirm('Вы уверены, что хотите покинуть страницу? Все несохраненные изменения будут потеряны.');
    else return true;
  }


  currentStep: number = 0;
  showInfo = false;
  steps: Step[] = steps;
  currentUser: IUser = { ...nullUser };
  form: FormGroup;
  isAwaitingApprove = false;
  loading = false;
  successModalShow = false;
  approveModalShow = false;
  exitModalShow = false;
  editModalShow = false;
  createModalShow = false;

  images: string[][] = [['']];
  defaultImage: string = '/assets/images/add-main-photo.png';
  defaultInstructionImage: string = '/assets/images/add-photo.png';
  mainImage: string = '';

  selectedCategories: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();
  beginningData: any;
  editMode: boolean = false;
  instructionImagesVisibility: boolean[] = [];
  modifiedRecipe: IRecipe = { ...nullRecipe };
  oldCategoriesIds: number[] = [];
  instructionImages: { url: Blob; instructionId: number }[] = [];
  oldInstructions: Instruction[] = [];

  constructor(
    private categoryService: CategoryService,
    private notifyService: NotificationService,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private userService: UserService,
    private recipeService: RecipeService,
    private fb: FormBuilder,
    public router: Router,
  ) {
    this.mainImage = this.defaultImage;
    this.form = this.fb.group({
      recipeName: [
        '',
        [
          trimmedMinLengthValidator(3),
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],

      description: [
        '',
        [
          trimmedMinLengthValidator(15),
          Validators.minLength(15),

          Validators.maxLength(5000),
          Validators.required,
        ],
      ],
      history: ['', [Validators.maxLength(5000)]],
      preparationTime: ['', [Validators.maxLength(20)]],
      cookingTime: ['', [Validators.maxLength(20)]],
      portions: [1],
      origin: ['', [Validators.maxLength(20)]],
      nutritions: this.fb.array([]),
      ingredients: this.fb.array([]),
      instructions: this.fb.array([]),
      categories: this.fb.array([]),
      image: [null], // Это поле для загрузки картинки
    });
  }

  ngOnInit(): void {
    addModalStyle(this.renderer);

    this.subscriptions.add(this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user: IUser) => {
        {
          this.currentUser = user;
        }
      }));

    if (this.editedRecipe.id > 0) {
      this.loading = true;
      this.editMode = true;

      const id = this.editedRecipe.id;
     this.subscriptions.add( this.recipeService
        .getRecipeForEditing(id)
        .pipe(
          tap((recipe) => {
            this.form.get('recipeName')?.setValue(recipe.name);
            this.form.get('description')?.setValue(recipe.description);
            this.form.get('history')?.setValue(recipe.history);
            this.form.get('preparationTime')?.setValue(recipe.preparationTime);
            this.form.get('cookingTime')?.setValue(recipe.cookingTime);
            this.form.get('portions')?.setValue(recipe.servings);
            this.form.get('origin')?.setValue(recipe.origin);
            this.form.get('cookingTime')?.setValue(recipe.cookingTime);

            for (let i = 1; i <= recipe.nutritions.length; i++) {
              this.addNutrition();
              const nutritionsArray = this.form.get('nutritions') as FormArray;
              const nutritionGroup = nutritionsArray.at(i - 1) as FormGroup;
              const nutritionName = nutritionGroup.get('name') as FormControl;
              const nutritionQuantity = nutritionGroup.get(
                'quantity',
              ) as FormControl;
              const nutritionUnit = nutritionGroup.get('unit') as FormControl;
              nutritionName?.setValue(recipe.nutritions[i - 1].name);
              nutritionQuantity?.setValue(recipe.nutritions[i - 1].quantity);
              nutritionUnit?.setValue(recipe.nutritions[i - 1].unit);
            }

            this.editedRecipe = recipe;

            const categories$ = this.categoryService
              .getShortCategoriesByRecipe(id)
              .pipe(
                tap((categories) => {
                  this.selectedCategories = categories;
                  this.oldCategoriesIds = categories.map((c) => c.id);
                }),
              );

            const ingredients$ = this.recipeService.getIngredients(id).pipe(
              tap((ingredients: any) => {
                this.editedRecipe.ingredients = ingredients;
                for (let i = 1; i <= ingredients.length; i++) {
                  this.addIngredient();
                  const ingredientsArray = this.form.get(
                    'ingredients',
                  ) as FormArray;
                  const ingredientGroup = ingredientsArray.at(
                    i - 1,
                  ) as FormGroup;
                  const ingredientName = ingredientGroup.get(
                    'name',
                  ) as FormControl;
                  const ingredientQuantity = ingredientGroup.get(
                    'quantity',
                  ) as FormControl;
                  const ingredientUnit = ingredientGroup.get(
                    'unit',
                  ) as FormControl;
                  ingredientName?.setValue(ingredients[i - 1].name);
                  ingredientQuantity?.setValue(ingredients[i - 1].quantity);
                  ingredientUnit?.setValue(ingredients[i - 1].unit);
                }
              }),
            );

            const instructions$ = this.recipeService.getInstructions(id).pipe(
              tap((instructions: Instruction[]) => {
                this.editedRecipe.instructions = instructions;
                for (
                  let i = 1;
                  i <= this.editedRecipe.instructions.length;
                  i++
                ) {
                  this.addInstruction();
                  const instructionsArray = this.form.get(
                    'instructions',
                  ) as FormArray;
                  const instructionGroup = instructionsArray.at(
                    i - 1,
                  ) as FormGroup;
                  const instructionName = instructionGroup.get(
                    'name',
                  ) as FormControl;
                  const id = instructionGroup.get('id') as FormControl;
                  instructionName?.setValue(recipe.instructions[i - 1].name);
                  id.setValue(recipe.instructions[i - 1].id);
                }
                this.oldInstructions = this.form.value.instructions;

                this.images = Array.from(
                  { length: this.editedRecipe.instructions.length },
                  () => Array.from({ length: 3 }, () => ''),
                );
              }),
            );

const instructionsImages$ = this.recipeService.getInstructionsImages(id).pipe(
  concatMap((response) => {
    const instructions = response.filter((res) => res); // Фильтруем пустые значения

    return from(instructions).pipe(
      concatMap((res) => {
        if (res.image) {
          return this.recipeService.downloadInstructionImage(res.image).pipe(
            catchError(() => EMPTY), // Обрабатываем ошибку загрузки
            tap((blob) => {
              const imageFile = getFileFromBlob(blob);
              const imageData = {
                url: imageFile,
                instructionId: res.instructionId,
              };
              this.instructionImages.push(imageData);
              this.cd.markForCheck(); // Обновление представления
            }),
          );
        } else {
          return of(null);
        }
      }),
      last(),
    );
  }),
);

            const image$: Observable<any> = recipe.mainImage
              ? this.recipeService.downloadRecipeImage(recipe.mainImage).pipe(
                  tap((blob) => {
                    if (blob) {
                      this.form.get('image')?.setValue('existing_photo');
                      this.editedRecipe.imageURL = URL.createObjectURL(blob);
                      this.mainImage = this.editedRecipe.imageURL;

                      this.cd.markForCheck();
                    }
                  }),
                  catchError(() => {
                    return EMPTY;
                  }),
                )
              : of(null);

            this.subscriptions.add(combineLatest([categories$, instructions$, ingredients$])
              .pipe(takeUntil(this.destroyed$))
              .subscribe(
                () => {
                  this.subscriptions.add(image$
                    .pipe(
                      takeUntil(this.destroyed$),
                      finalize(() => {
                        this.subscriptions.add(instructionsImages$
                          .pipe(
                            takeUntil(this.destroyed$),
                            finalize(() => {
                              this.loading = false;
                              addModalStyle(this.renderer);

                              this.instructionImages.forEach((image) => {
                                const instructionsArray = this.f('instructions');
                                const instructionIndex =
                                  instructionsArray.controls.findIndex(
                                    (control: AbstractControl) => {
                                      const id = control.get('id')?.value;
                                      return id === image.instructionId;
                                    },
                                  );
                                const instructionGroup =
                                  instructionsArray.controls.find(
                                    (control: AbstractControl) => {
                                      const instructionId =
                                        control.get('id')?.value;
                                      return (
                                        instructionId === image.instructionId
                                      );
                                    },
                                  );
                                const imagesArray = instructionGroup?.get(
                                  'images',
                                ) as FormArray;

                                let indexToAdd: number;
                                const emptyControlIndex =
                                  imagesArray.controls.findIndex(
                                    (control: AbstractControl) => {
                                      const value = control.value.file;
                                      return value == null;
                                    },
                                  );

                                if (emptyControlIndex !== -1) {
                                  // Если есть пустой контрол, добавляем файл в него
                                  indexToAdd = emptyControlIndex;
                                  imagesArray.at(indexToAdd).setValue({
                                    file: image.url,
                                  });
                                }

                                this.instructionImagesVisibility[
                                  instructionIndex
                                ] = true;
                                this.images[instructionIndex][emptyControlIndex] =
                                  URL.createObjectURL(image.url);
                              });

                              this.oldInstructions = this.form.value.instructions;
                              this.loading = false;

                              this.beginningData = this.form.getRawValue();

                              this.cd.markForCheck();
                            }),
                          )
                          .subscribe());
                      }),
                    )
                    .subscribe());
                },
              ));
          }),
        )
        .subscribe());
    } else {
      this.beginningData = this.form.getRawValue();
    }
  }

  openAllInstructions() {
   this.instructionImagesVisibility= this.instructionImagesVisibility.map(iiv => iiv = true);
  }

  closeAllInstructions() {
   this.instructionImagesVisibility= this.instructionImagesVisibility.map(iiv => iiv = false);
  }

  anyOpen() {
    return this.instructionImagesVisibility.some((iiv)=>iiv === true)
  }
    anyClosed() {
    return this.instructionImagesVisibility.some((iiv)=>iiv === false)
  }



  controlInvalid(control: string, group: any) {
    return (
      group.get(control)?.invalid &&
      (group.get(control)?.dirty || group.get(control)?.touched)
    );
  }

  sendNotificationsAfterPublishingRecipe() {
    this.userService
      .getFollowersIds(this.currentUser.id)
      .pipe(
        tap((authorFollowers: number[]) => {
          const notifyForFollower = notifyForFollowersOfApprovedRecipeAuthor(
            this.currentUser.fullName || `@${this.currentUser.username}`,
            this.savedRecipe,
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

  private editRecipe() {
    const categoriesIds: number[] = [];
    this.selectedCategories.forEach((element) => {
      categoriesIds.push(element.id);
    });
    const updatedRecipe: IRecipe = {
      ...getRecipeByForm(this.form),
      id: this.editedRecipe.id,
      mainImage: this.getImageOfSavedRecipe(),
      status: this.getStatusOfSavedRecipe(),
      categories: categoriesIds,
    };

    this.PUTRecipe(updatedRecipe);
  }

  private saveRecipe() {
    this.loading = true;
    if (this.editMode) {
      this.editRecipe();
    } else {
      this.createRecipe();
    }
  }

  private createRecipe() {
    const categoriesIds: number[] = [];
    this.selectedCategories.forEach((element) => {
      categoriesIds.push(element.id);
    });
    const createdRecipe: IRecipe = {
      ...getRecipeByForm(this.form),
      status: this.getStatusOfSavedRecipe(),
      categories: categoriesIds,
      authorId: this.currentUser.id,
    };

    this.POSTRecipe(createdRecipe);
  }

  savedRecipe: IRecipe = { ...nullRecipe };

  POSTRecipe(recipe: IRecipe) {
    const file: File = this.form.value.image;
    this.savedRecipe = recipe;

    this.recipeService
      .postRecipe(recipe)
      .pipe(
        catchError((response: any) => {
          if (response.error.info == 'NAME_EXISTS') {
            this.throwErrorModal(
              'Рецепт с таким названием уже существует. Измените название и попробуйте снова.',
            );
          } else {
            this.throwErrorModal(
              'Произошла ошибка при попытке создать рецепт.',
            );
          }
          return of(null);
        }),
        concatMap((response: any) => {
          const insertedId = response.id;
          this.savedRecipe.id = insertedId;

          const ingredients$: Observable<any>[] = [];
          recipe.ingredients.forEach((ingredient) => {
            ingredients$.push(
              this.recipeService.postIngredientToRecipe(
                insertedId,
                ingredient.quantity,
                ingredient.name,
                ingredient.unit,
              ),
            );
          });
          const categories$: Observable<any>[] = [];

          recipe.categories.forEach((categoryId) => {
            categories$.push(
              this.recipeService.setCategoryToRecipe(categoryId, insertedId),
            );
          });

          const instructions$: Observable<any>[] = [];
          this.form.value.instructions.forEach((instruction: Instruction) =>
            instructions$.push(
              postInstruction(this.recipeService, insertedId, instruction),
            ),
          );

          const ingredients = ingredients$.length
            ? // Используем from и concatMap для последовательной загрузки инструкций
              from(ingredients$).pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при загрузке новых ингредиентов рецепта.',
                  );
                  return EMPTY;
                }),
                concatMap((ingredient) => ingredient),
                last(),
              )
            : of(null);
          


          return ingredients.pipe(
            concatMap(() =>
              combineLatest(categories$.length ? categories$ : of(null)),
            ),
            concatMap(() => {
              if (instructions$.length) {
                // Используем from и concatMap для последовательной загрузки инструкций
                return from(instructions$).pipe(
                  concatMap((instructionObservable) => instructionObservable),
                  last(),
                );
              } else {
                return of(null);
              }
            }),
            concatMap(() => {
              if (file) {
                return this.recipeService.uploadRecipeImage(file).pipe(
                  concatMap((uploadResponse: any) => {
                    const filename = uploadResponse.filename;
                    return this.recipeService
                      .setRecipeImage(insertedId, filename)
                      .pipe(
                        catchError(() => {
                          this.throwErrorModal(
                            'Произошла ошибка при попытке связать загруженное изображение и рецепт.',
                          );
                          return EMPTY;
                        }),
                      );
                  }),
                );
              } else {
                return of(null);
              }
            }),
          );
        }),

        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
        last(),
      )
      .subscribe({
        next: () => {
          this.successModalShow = true;
        },
      });
  }

  PUTRecipe(recipe: IRecipe) {
    let loadImage = false;
    let deleteImage = false;

    const image = this.form.value.image;

    if (image === null) {
      deleteImage = true;
    } else if (image !== 'existing_photo') {
      loadImage = true;
      deleteImage = true;
    }

    const file: File = this.form.value.image;
    this.savedRecipe = recipe;

    const putRecipe$ = this.recipeService.updateRecipe(recipe).pipe(
      catchError((response: any) => {
        if (response.error.info == 'NAME_EXISTS') {
          this.throwErrorModal(
            'Рецепт с таким названием уже существует. Измените название и попробуйте снова.',
          );
        } else {
          this.throwErrorModal('Произошла ошибка при попытке обновить рецепт.');
        }
        return EMPTY;
      }),
    );
    const ingredients$ = compareIngredients(
      this.recipeService,
      this.editedRecipe.ingredients,
      recipe.ingredients,
      this.editedRecipe.id,
    );
    const categories$ = compareCategories(
      this.recipeService,
      this.selectedCategories,
      this.oldCategoriesIds,
      this.editedRecipe.id,
    );
    const instructions$ = compareInstructions(
      this.recipeService,
      this.form.value.instructions,
      this.oldInstructions,
      this.editedRecipe.id,
    );

    const loadImage$ = loadImage
      ? this.recipeService.uploadRecipeImage(file).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке загрузить файл нового изображения рецепта.',
            );
            return EMPTY;
          }),
          concatMap((response: any) => {
            const filename = response.filename;
            return this.recipeService.setRecipeImage(recipe.id, filename).pipe(
              catchError(() => {
                this.throwErrorModal(
                  'Произошла ошибка при попытке связать новое загруженное изображение и рецепт.',
                );
                return EMPTY;
              }),
            );
          }),
        )
      : of(null);

    const deleteImage$ = deleteImage
      ? this.recipeService.deleteRecipeImage(this.editedRecipe.id).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке удалить старое изображение рецепта.',
            );
            return EMPTY;
          }),
          concatMap(() => {
            return this.recipeService.setRecipeImage(recipe.id, '').pipe(
              catchError(() => {
                this.throwErrorModal(
                  'Произошла ошибка при попытке удаления связи старого изображения с рецептом.',
                );
                return EMPTY;
              }),
            );
          }),
        )
      : of(null);

    putRecipe$
      .pipe(
        concatMap(() =>
          categories$.delete.pipe(
            catchError(() => {
              this.throwErrorModal(
                'Произошла ошибка при попытке удалить старые категории рецепта.',
              );
              return EMPTY;
            }),
          ),
        ),
        concatMap(() =>
          combineLatest(categories$.insert).pipe(
            catchError(() => {
              this.throwErrorModal(
                'Произошла ошибка при загрузке новых категорий рецепта.',
              );
              return EMPTY;
            }),
          ),
        ),

        concatMap(() =>
          ingredients$.delete.pipe(
            catchError(() => {
              this.throwErrorModal(
                'Произошла ошибка при попытке удалить старые ингредиенты рецепта.',
              );
              return EMPTY;
            }),
          ),
        ),
        concatMap(() => {
          if (ingredients$.insert.length) {
            // Используем from и concatMap для последовательной загрузки инструкций
    return from(ingredients$.insert).pipe(
      concatMap((ingredient) => ingredient),
      catchError(() => {
        this.throwErrorModal(
          'Произошла ошибка при загрузке новых ингредиентов рецепта.',
        );
        return EMPTY;
      }),
     last()
    );
          } else {
            return of(null);
          }
        }
        ),

        concatMap(() =>
          combineLatest(
            instructions$.delete.length ? instructions$.delete : of(null),
          ).pipe(
            catchError(() => {
              this.throwErrorModal(
                'Произошла ошибка при удалении старых инструкций рецепта.',
              );
              return EMPTY;
            }),
          ),
        ),

        concatMap(() => {
          if (instructions$.insert.length) {
            // Используем from и concatMap для последовательной загрузки инструкций
            return from(instructions$.insert).pipe(
              catchError(() => {
                this.throwErrorModal(
                  'Произошла ошибка при загрузке новых инструкций рецепта.',
                );
                return EMPTY;
              }),
              concatMap((instructionObservable) => instructionObservable),
              last(),
            );
          } else {
            return of(null);
          }
        }),

        concatMap(() => deleteImage$),
        concatMap(() => loadImage$),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
        last(),
      )
      .subscribe({
        next: () => {
          this.successModalShow = true;
          this.afterEditingRecipe();
        },
      });
  }

  errorModal: boolean = false;
  errorModalContent = '';

  throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }

  handleErrorModal() {
    this.errorModal = false;
    addModalStyle(this.renderer);
  }

  handleSuccessModal() {
    if (
      this.savedRecipe.status === 'public' &&
      this.currentUser.role !== 'user' &&
      !this.editMode
    ) {
      this.sendNotificationsAfterPublishingRecipe();
    }

    this.successModalShow = false;
    if (
      !this.editMode &&
      this.userService.getPermission(
        this.currentUser.limitations || [],
        this.isAwaitingApprove
          ? Permission.RecipeSend
          : Permission.RecipeCreated,
      )
    ) {
      const notify: INotification = this.notifyService.buildNotification(
        this.isAwaitingApprove
          ? this.currentUser.role === 'user'
            ? 'Рецепт создан и отправлен на проверку'
            : 'Рецепт создан и опубликован'
          : 'Рецепт создан',
        `Рецепт «${this.savedRecipe.name}» успешно сохранен в ваших рецептах${
          this.isAwaitingApprove
            ? this.currentUser.role === 'user'
              ? ' и отправлен на проверку'
              : ' и опубликован'
            : ''
        }`,
        'success',
        'recipe',
        '/recipes/list/' + this.savedRecipe.id,
      );
      this.notifyService
        .sendNotification(notify, this.currentUser.id, true)
        .subscribe();
    }
    if (!this.editMode)
      this.router.navigateByUrl(`/recipes/list/${this.savedRecipe.id}`);
    else this.updatedRecipeEmitter.emit(true);
    this.closeEmitter.emit(true);
  }

  afterEditingRecipe() {
    if (
      this.editedRecipe.id > 0 &&
      this.userService.getPermission(
        this.currentUser.limitations || [],
        this.isAwaitingApprove
          ? Permission.RecipeSend
          : Permission.RecipeEdited,
      )
    ) {
      this.notifyService
        .sendNotification(
          notifyForEditedRecipeAuthor(
            this.notifyService,
            this.isAwaitingApprove,
            this.currentUser.role,
            this.editedRecipe,
          ),
          this.currentUser.id,
          true,
        )
        .subscribe();

      if (
        this.currentUser.role !== 'user' &&
        this.savedRecipe.status === 'public'
      ) {
        this.sendNotificationsAfterPublishingRecipe();
      }
    }
  }

  handleApproveModal(answer: boolean): void {
    if (answer) {
      this.isAwaitingApprove = true;
      this.saveRecipe();
    }
    this.approveModalShow = false;
    this.cd.markForCheck();
  }

  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }

  //модальные окна
  handleCreateRecipeModal(answer: boolean): void {
    if (answer) {
      this.saveRecipe();
    } else {
      addModalStyle(this.renderer);
    }
    this.createModalShow = false;
  }

  handleEditRecipeModal(answer: boolean): void {
    if (answer) {
      this.saveRecipe();
    } else {
      addModalStyle(this.renderer);
    }

    this.editModalShow = false;
    this.cd.markForCheck();
  }

  handleExitModal(answer: boolean): void {
    this.exitModalShow = false;

    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      addModalStyle(this.renderer);
    }
  }

  areObjectsEqual(): boolean {

const newFiles = this.form.value.instructions.map((instruction: any) =>
  instruction.images.map((image: any) => image?.file?.name || ''),
);

const oldFiles = this.oldInstructions.map((instruction) =>
  instruction.images.map((image: any) => image?.file?.name || ''),
);

    
    const areCategoriesEqual =
      JSON.stringify(this.oldCategoriesIds) ===
      JSON.stringify(this.selectedCategories.map((c) => c.id));

    const areFilesEqual = JSON.stringify(oldFiles) === JSON.stringify(newFiles);

    const isFormChanged =
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue());

    if (!this.editMode) {
      // В режиме не редактирования проверяем только категории
      return !areCategoriesEqual || isFormChanged;
    } else {
      // В режиме редактирования проверяем и файлы
      return !areCategoriesEqual || !areFilesEqual || isFormChanged;
    }

  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.areObjectsEqual()
      ? (this.exitModalShow = true)
      : this.closeEmitter.emit(true);
  }

  close() {
    this.areObjectsEqual()
      ? (this.exitModalShow = true)
      : this.closeEmitter.emit(true);
  }

  clickOnCircleStep(i: number) {
    if (this.validNextSteps() === 0 || this.validNextSteps() > i) {
      this.currentStep = i;
      this.scrollTop();
    }
  }

  notValid() {
    return this.validNextSteps();
  }

  noValidStepDescription(step: number): string {
    return noValidStepDescription(step);
  }

  validNextSteps(): number {
    for (let s = 0; s <= 6; s++) {
      switch (s) {
        case 0:
          if (
            !(
              this.form.get('recipeName')!.valid &&
              this.form.get('history')!.valid &&
              this.form.get('description')!.valid
            )
          ) {
            return 1;
          }
          break;
        case 1:
          if (
            !(
              this.form.get('preparationTime')!.valid &&
              this.form.get('cookingTime')!.valid &&
              this.form.get('origin')!.valid &&
              this.form.get('portions')!.valid
            )
          ) {
            return 2;
          }
          break;
        case 2:
          if (!(this.selectedCategories.length <= 5)) {
            return 3;
          }
          break;
        case 3:
          if (!this.form.get('ingredients')!.valid) {
            return 4;
          }
          break;
        case 4:
          if (!this.form.get('nutritions')!.valid) {
            return 5;
          }
          break;
        case 5:
          if (!this.form.get('instructions')!.valid) {
            return 6;
          }
          break;
      }
    }
    return 0;
  }

  f(field: string): FormArray {
    return this.form.get(field) as FormArray;
  }

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;

      this.scrollTop();
    }
  }
  goToNextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.scrollTop();
    }
  }
  scrollTop(): void {
    if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
  }

  //drag&drop
  drop(context: string, event: CdkDragDrop<string[]>) {
    this.moveItemInFormArray(
      this.f(context),
      event.previousIndex,
      event.currentIndex,
    );
    this.cd.markForCheck();
  }

  moveItemInFormArray(
    formArray: FormArray,
    fromIndex: number,
    toIndex: number,
  ): void {
    const dir = toIndex > fromIndex ? 1 : -1;

    const item = formArray.at(fromIndex);
    for (let i = fromIndex; i * dir < toIndex * dir; i = i + dir) {
      const current = formArray.at(i + dir);
      formArray.setControl(i, current);
    }
    formArray.setControl(toIndex, item);
  }

  //Работа с категориями
  addCategory(event: ICategory) {
    if (this.selectedCategories.length < 5) {
      const findedCategory: ICategory | undefined =
        this.selectedCategories.find((category) => category.id === event.id);
      if (findedCategory === undefined) {
        this.selectedCategories.push(event);
      }
    }
  }

  removeCategory(event: ICategory) {
    this.selectedCategories = this.selectedCategories.filter((myCategory) => {
      if (myCategory.id !== event.id) return true;
      else return false;
    });
  }

  //Работа с картинками
  //удаляем фото из инструкций рецепта по индеку инструкции и фото
  removeInstructionPhoto(instructionIndex: number, imageIndex: number) {
    const instructionsArray = this.form.get('instructions') as FormArray;
    const instructionGroup = instructionsArray.at(
      instructionIndex,
    ) as FormGroup;
    const imagesArray = instructionGroup.get('images') as FormArray;
    imagesArray.at(imageIndex).get('file')?.setValue(null);
    this.images[instructionIndex][imageIndex] = '';
  }

  //получаем url загруженного фото инструкции для вывода в background-image
  getInstructionPhotoURL(instructionIndex: number, imageIndex: number): string {
    return this.images &&
      this.images[instructionIndex] &&
      this.images[instructionIndex][imageIndex]
      ? this.images[instructionIndex][imageIndex]
      : this.defaultInstructionImage;
  }

  instuctionImageChange(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    instructionIndex: number,
    imageIndex: number,
  ) {
    const file = event.target.files[0];

    if (file) {
      if (checkFile(file)) {
        const formData = new FormData();
        formData.append('instuctionPhoto', file);

        const instructionsArray = this.form.get('instructions') as FormArray;
        const instructionGroup = instructionsArray.at(
          instructionIndex,
        ) as FormGroup;
        const imagesArray = instructionGroup.get('images') as FormArray;
        const imageControl = imagesArray.at(imageIndex);

        const input = event.target as HTMLInputElement;
        const instuctionPicFile: File | undefined = input.files?.[0];

        if (instuctionPicFile) {
          imageControl?.patchValue({
            file: instuctionPicFile,
          });
          const objectURL = URL.createObjectURL(instuctionPicFile);
          if (!this.images[instructionIndex]) {
            this.images[instructionIndex] = ['']; // Инициализация массива с одним пустым URL
          }
          this.images[instructionIndex][imageIndex] = objectURL;

          // Помечаем элемент управления как измененный
          imageControl?.markAsDirty();
        }

      }
    }

  }

  mainPhotoChange(event: any) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile && checkFile(userpicFile)) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.mainImage = objectURL;
    }
  }

  unsetMainImage() {
    this.form.get('image')?.setValue(null);
    this.mainImage = this.defaultImage;
  }

  createImageControl() {
    return this.fb.group({
      file: [null],
    });
  }

  addIngredient() {
    this.f('ingredients').push(
      this.fb.group({
        name: [
          '',
          [
            notOnlyGroupDivider(),
            trimmedMinLengthValidator(2),
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        quantity: [
          '',
          [Validators.maxLength(6), customPatternValidator(numbers)],
        ],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }

  removeIngredient(index: number) {
    this.f('ingredients').removeAt(index);
  }

  addNutrition() {
    this.f('nutritions').push(
      this.fb.group({
        name: [
          '',
          [
            notOnlyGroupDivider(),

            Validators.required,
            trimmedMinLengthValidator(2),
            Validators.minLength(2),
            Validators.maxLength(20),
          ],
        ],
        quantity: [
          '',
          [Validators.maxLength(6), customPatternValidator(numbers)],
        ],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }

  removeNutrition(index: number) {
    this.f('nutritions').removeAt(index);
  }

  removeInstruction(index: number) {
    this.images.splice(index, 1);
    this.instructionImagesVisibility.splice(index, 1);
    this.f('instructions').removeAt(index);
  }

  getImages(instructionIndex: number): AbstractControl<any, any>[] {
    const instructionsArray = this.f('instructions');
    const instructionGroup = instructionsArray.at(
      instructionIndex,
    ) as FormGroup;
    const imagesArray = instructionGroup.get('images') as FormArray;
    return imagesArray.controls;
  }

  addInstruction() {
    this.f('instructions').push(
      this.fb.group({
        id: [0],
        name: [
          '',
          [
            Validators.required,
            trimmedMinLengthValidator(2),
            Validators.minLength(2),
            Validators.maxLength(1000),
          ],
        ],

        images: this.fb.array([
          this.createImageControl(),
          this.createImageControl(),
          this.createImageControl(),
        ]),
      }),
    );

    this.images.push(['', '', '']);
    this.instructionImagesVisibility.push(false);
  }

  getImageOfSavedRecipe() {
    let image = '';
    const selectedImage = this.form.get('image')?.value;
    if (this.editedRecipe.mainImage && selectedImage === 'existing_photo') {
      image = this.editedRecipe.mainImage;
    } else {
      if (selectedImage) {
        image = 'image';
      }
    }
    return image;
  }

  getStatusOfSavedRecipe() {
    return this.isAwaitingApprove
      ? this.currentUser.role === 'user'
        ? 'awaits'
        : 'public'
      : 'private';
  }
}
