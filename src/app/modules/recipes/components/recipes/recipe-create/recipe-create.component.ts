/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
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
} from './consts';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { IRecipe, Instruction, nullRecipe } from '../../../models/recipes';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ICategory } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import { EMPTY, Observable, Subject, concat, forkJoin, of, pipe } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  finalize,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  addModalStyle,
  getCurrentDate,
  removeModalStyle,
} from 'src/tools/common';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { notifyForFollowersOfApprovedRecipeAuthor } from 'src/app/modules/authentication/components/control-dashboard/notifications';
import {
  customPatternValidator,
  trimmedMinLengthValidator,
} from 'src/tools/validators';
import { numbers } from 'src/tools/regex';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import {
  compareCategories,
  compareIngredients,
  compareInstructions,
} from './compare';

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
  createdRecipe: IRecipe = nullRecipe;
  protected destroyed$: Subject<void> = new Subject<void>();
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

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user: IUser) => {
        {
          this.currentUser = user;
        }
      });

    if (this.editedRecipe.id > 0) {
      this.loading = true;
      this.editMode = true;

      const id = this.editedRecipe.id;
      this.recipeService
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

            const instructionsImages$ = this.recipeService
              .getInstructionsImages(id)
              .pipe(
                concatMap((response) => {
                  const downloadImageObservables = response.map((res) => {
                    if (!res) {
                      // Если в ответе нет изображений, возвращаем пустой Observable
                      return of(null);
                    }

                    if (res.image) {
                      return this.recipeService.downloadImage(res.image).pipe(
                        tap((blob) => {
                          const imageFile = getFileFromBlob(blob);
                          const imageData = {
                            url: imageFile,
                            instructionId: res.instructionId,
                          };
                          this.instructionImages.push(imageData);
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

            const image$ = recipe.mainImage
              ? this.recipeService.downloadImage(recipe.mainImage).pipe(
                  finalize(() => {
                    this.cd.markForCheck();
                  }),
                  tap((blob) => {
                    if (blob) {
                      this.form.get('image')?.setValue('url');
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

            forkJoin([
              categories$,
              instructions$,
              ingredients$,
              instructionsImages$,
              image$,
            ]).subscribe(() => {
              addModalStyle(this.renderer);

              this.instructionImages.forEach((image) => {
                const instructionsArray = this.f('instructions');
                const instructionIndex = instructionsArray.controls.findIndex(
                  (control: AbstractControl) => {
                    const id = control.get('id')?.value;
                    return id === image.instructionId;
                  },
                );
                const instructionGroup = instructionsArray.controls.find(
                  (control: AbstractControl) => {
                    const instructionId = control.get('id')?.value;
                    return instructionId === image.instructionId;
                  },
                );
                const imagesArray = instructionGroup?.get(
                  'images',
                ) as FormArray;

                let indexToAdd: number;
                const emptyControlIndex = imagesArray.controls.findIndex(
                  (control: AbstractControl) => {
                    const value = control.value.file;
                    return value == null;
                  },
                );

                if (emptyControlIndex !== -1) {
                  // Если есть пустой контрол, добавляем файл в него
                  indexToAdd = emptyControlIndex;
                  imagesArray.at(indexToAdd).setValue({ file: image.url });
                }

                this.instructionImagesVisibility[instructionIndex] = true;
                this.images[instructionIndex][emptyControlIndex] =
                  URL.createObjectURL(image.url);
              });
              this.oldInstructions = this.form.value.instructions;
              this.loading = false;

              this.cd.markForCheck();
              this.beginningData = this.form.getRawValue();
            });
          }),
        )
        .subscribe();
    } else {
      this.beginningData = this.form.getRawValue();
    }
  }

  private buildRecipe() {
    if (this.form.valid) {
      const categoriesIds: number[] = [];
      this.selectedCategories.forEach((element) => {
        categoriesIds.push(element.id);
      });

      const recipeData: IRecipe = {
        name: this.form.value.recipeName,
        reports: [],
        statistics: [],
        ingredients: this.form.value.ingredients,
        instructions: this.form.value.instructions,
        mainImage: '',
        description: this.form.value.description,
        history: this.form.value.history,
        preparationTime: this.form.value.preparationTime,
        cookingTime: this.form.value.cookingTime,
        origin: this.form.value.origin,
        nutritions: this.form.value.nutritions,
        servings: this.form.value.portions,
        authorId: this.currentUser.id,
        categories: categoriesIds,
        cooksId: [],
        likesId: [],
        favoritesId: [],
        id: 0,
        comments: [],
        publicationDate: getCurrentDate(),
        status: this.isAwaitingApprove
          ? this.currentUser.role === 'user'
            ? 'awaits'
            : 'public'
          : 'private',
      };
      recipeData.ingredients.forEach((ingredient) => {
        const findedIngredient = recipeData.ingredients.find(
          (i) => i === ingredient,
        );
        if (findedIngredient && findedIngredient.quantity) {
          findedIngredient.quantity = ingredient.quantity
            .toString()
            .replace(',', '.');
        }
      });

      this.loading = true;
      this.cd.markForCheck();

      this.createdRecipe = { ...recipeData };

      if (this.form.get('image')?.value) {
        this.recipeService
          .uploadRecipeImage(this.form.get('image')?.value)
          .subscribe((res: any) => {
            const filename = res.filename;
            recipeData.mainImage = filename;
            this.postRecipe(recipeData);
          });
      } else {
        this.postRecipe(recipeData);
      }
    }
  }

  private postRecipe(recipe: IRecipe) {
    this.recipeService
      .postRecipe(recipe)
      .pipe(
        catchError(() => {
          this.loading = false;
          this.cd.markForCheck();
          return EMPTY;
        }),
        tap((response: any) => {
          const recipeId = response.id;
          this.createdRecipe.id = recipeId;
          let subscribes: Observable<any>[] = [];
          this.createdRecipe.ingredients.forEach((ingredient) => {
            subscribes.push(
              this.recipeService.postIngredientToRecipe(
                recipeId,
                ingredient.quantity,
                ingredient.name,
                ingredient.unit,
              ),
            );
          });
          recipe.categories.forEach((categoryId) => {
            subscribes.push(
              this.recipeService.setCategoryToRecipe(categoryId, recipeId),
            );
          });

          const instructions$ = compareInstructions(
            this.recipeService,
            this.form.value.instructions,
            this.oldInstructions,
            this.editedRecipe.id,
          );

          subscribes = [...subscribes, ...instructions$]

          forkJoin(subscribes)
            .pipe(
              finalize(() => {
                this.loading = false;
                this.successModalShow = true;
                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();
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
            this.currentUser,
            this.createdRecipe,
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
                  ),
                ),
              );
          });

          forkJoin(notifications).subscribe();
        }),
      )
      .subscribe();
  }

  editRecipeAfterImageLoading() {
    if (this.createdRecipe.mainImage === ('url' || 'image')) {
      this.createdRecipe.mainImage = '';
    }
    const putRecipe$ = this.recipeService.updateRecipe(this.createdRecipe);
    const ingredients$ = compareIngredients(
      this.recipeService,
      this.editedRecipe.ingredients,
      this.createdRecipe.ingredients,
      this.editedRecipe.id,
    );
    const categories$: Observable<any>[] = compareCategories(
      this.recipeService,
      this.selectedCategories,
      this.oldCategoriesIds,
      this.editedRecipe.id,
    );

    const instructions$: Observable<any>[] = compareInstructions(
      this.recipeService,
      this.form.value.instructions,
      this.oldInstructions,
      this.editedRecipe.id,
    );

    const subscribes$ = [
      putRecipe$,
      ingredients$.delete,
      ...categories$,
      ...instructions$,
    ];

    forkJoin(subscribes$)
      .pipe(
        finalize(() => {
          forkJoin(ingredients$.insert)
            .pipe(
              finalize(() => {
                this.loading = false;
                this.successModalShow = true;
                this.afterEditingRecipe();
                this.cd.markForCheck();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe(() => {});
  }

  updateRecipeImage() {
    const images$ = this.checkImagesOfEditedRecipe();
    if (images$.length) {
      forkJoin(images$).subscribe(() => {
        this.editRecipeAfterImageLoading();
      });
    } else {
      this.editRecipeAfterImageLoading();
    }
  }

  checkImagesOfEditedRecipe() {
    let loadImage = false;
    let deleteImage = false;

    if (this.editedRecipe.mainImage !== this.createdRecipe.mainImage) {
      if (this.createdRecipe.mainImage) {
        loadImage = true;
      }
      if (this.editedRecipe.mainImage) {
        deleteImage = true;
      }
    }
    const images$ = [];
    if (loadImage) {
      images$.push(
        this.recipeService
          .uploadRecipeImage(this.form.get('image')?.value)
          .pipe(
            tap((response: any) => {
              const filename = response.filename;
              this.createdRecipe.mainImage = filename;
            }),
          ),
      );
    }

    if (deleteImage && this.editedRecipe.mainImage) {
      images$.push(this.recipeService.deleteImage(this.editedRecipe.mainImage));
    }

    return images$;
  }

  editRecipe() {
    let image = '';

    if (
      this.editedRecipe.mainImage &&
      this.form.get('image')?.value === 'url'
    ) {
      image = this.editedRecipe.mainImage;
    } else {
      if (this.form.get('image')?.value) {
        image = 'image';
      }
    }
    this.createdRecipe = {
      ...this.editedRecipe,
      name: this.form.value.recipeName,
      instructions: this.form.value.instructions,
      mainImage: image,
      ingredients: this.form.value.ingredients,
      description: this.form.value.description,
      history: this.form.value.history,
      preparationTime: this.form.value.preparationTime,
      cookingTime: this.form.value.cookingTime,
      origin: this.form.value.origin,
      nutritions: this.form.value.nutritions,
      servings: this.form.value.portions,
      status: this.isAwaitingApprove
        ? this.currentUser.role === 'user'
          ? 'awaits'
          : 'public'
        : 'private',
    };

    this.createdRecipe.ingredients.forEach((ingredient) => {
      const findedIngredient = this.modifiedRecipe.ingredients.find(
        (i) => i === ingredient,
      );
      if (findedIngredient && findedIngredient.quantity) {
        findedIngredient.quantity = ingredient.quantity
          .toString()
          .replace(',', '.');
      }
    });

    this.loading = true;
    this.cd.markForCheck();

    this.updateRecipeImage();
  }

  handleSuccessModal() {
    if (
      this.createdRecipe.status === 'public' &&
      this.currentUser.role !== 'user' &&
      !this.editMode
    ) {
      this.sendNotificationsAfterPublishingRecipe();
    }

    this.successModalShow = false;
    this.closeEmitter.emit(true);
    this.updatedRecipeEmitter.emit(true);
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
        `Рецепт «${this.createdRecipe.name}» успешно сохранен в ваших рецептах${
          this.isAwaitingApprove
            ? this.currentUser.role === 'user'
              ? ' и отправлен на проверку'
              : ' и опубликован'
            : ''
        }`,
        'success',
        'recipe',
        '/recipes/list/' + this.createdRecipe.id,
      );
      this.notifyService
        .sendNotification(notify, this.currentUser.id, true)
        .subscribe();
    }
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
        this.createdRecipe.status === 'public'
      ) {
        this.sendNotificationsAfterPublishingRecipe();
      }
    }
  }

  handleApproveModal(answer: boolean): void {
    if (answer) {
      this.isAwaitingApprove = true;

      if (this.editMode) this.editRecipe();
      else this.buildRecipe();
    }
    this.approveModalShow = false;
    this.cd.markForCheck();
  }

  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  //модальные окна
  handleCreateRecipeModal(answer: boolean): void {
    if (answer) {
      this.buildRecipe();
    } else {
      addModalStyle(this.renderer);
    }
    this.createModalShow = false;
  }

  handleEditRecipeModal(answer: boolean): void {
    if (answer) {
      this.editRecipe();
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
    if (
      JSON.stringify(this.oldCategoriesIds) ===
      JSON.stringify(this.selectedCategories.map((c) => c.id))
    )
      return (
        JSON.stringify(this.beginningData) !==
        JSON.stringify(this.form.getRawValue())
      );
    else return true;
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
    moveItemInArray(
      this.f(context).controls,
      event.previousIndex,
      event.currentIndex,
    );
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
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg']; // Разрешенные расширения файлов
      const fileName = file.name.toLowerCase();
      const extension = fileName.substring(fileName.lastIndexOf('.')); // Получаем расширение файла

      // Проверяем, что расширение файла присутствует в списке разрешенных расширений
      if (allowedExtensions.includes(extension)) {
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
        }
      }
    }
  }

  mainPhotoChange(event: any) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
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

  submitForm(): void {
    if (this.editMode) this.editModalShow = true;
    else this.createModalShow = true;
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
}
