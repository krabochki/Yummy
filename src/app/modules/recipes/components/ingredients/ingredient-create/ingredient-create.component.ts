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
  getInputPlaceholderOfControlGroup,
  getNameOfControlGroup,
  stepControlGroups,
  getIngredientByForm,
} from './consts';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { EMPTY, Observable, Subject, concat, forkJoin, of } from 'rxjs';
import {
  catchError,
  concatMap,
  finalize,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  customLinkPatternValidator,
  trimmedMinLengthValidator,
} from 'src/tools/validators';
import { anySiteMask } from 'src/tools/regex';

import {
  ProductType,
  productTypes,
} from 'src/app/modules/planning/models/shopping-list';
import { IngredientService } from '../../../services/ingredient.service';
import {
  IGroup,
  IIngredient,
  nullIngredient,
} from '../../../models/ingredients';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import {
  INotification,
  nullNotification,
} from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { checkFile } from 'src/tools/error.handler';

@Component({
  selector: 'app-ingredient-create',
  templateUrl: './ingredient-create.component.html',
  styleUrls: ['../../../../styles/forms.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientCreateComponent implements OnInit, OnDestroy {
  @ViewChild('input', { static: false }) input: ElementRef | undefined;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;
  @Input() editedIngredient: IIngredient = {...nullIngredient};
  @Output() editEmitter = new EventEmitter();
  @Output() closeEmitter = new EventEmitter<boolean>();

  form: FormGroup;

  currentUser: IUser = nullUser;
  productTypes = productTypes;

  oldGroupsIds: number[] = [];

  currentStep: number = 0;
  showInfo = false;
  steps: Step[] = steps;
  stepControlGroups = stepControlGroups;
  selectedIngredientsGroups: IGroup[] = [];

  autocompleteTypes: ProductType[] = [];
  selectedType: ProductType = productTypes[0];

  awaitModal = false;
  searchQuery: string = '';
  autocompleteShow: boolean = false;
  focused: boolean = false;

  createModalShow: boolean = false;
  successModalShow: boolean = false;
  exitModalShow: boolean = false;

  defaultImage: string = '/assets/images/add-ingredient.png';
  mainImage: string = '';

  beginningData: any;

  protected destroyed$: Subject<void> = new Subject<void>();

  get edit() {
    return this.editedIngredient.id > 0;
  }

  get validForm() {
    return (
      this.form.valid &&
      this.areObjectsEqual() &&
      this.selectedIngredientsGroups.length > 0
    );
  }

  get isManager() {
    return this.currentUser.role !== 'user';
  }

  constructor(
    private renderer: Renderer2,
    private ingredientService: IngredientService,
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    public router: Router,
    private cd: ChangeDetectorRef,
  ) {
    this.mainImage = this.defaultImage;
    this.form = this.fb.group({
      ingredientName: [
        '',
        [
          trimmedMinLengthValidator(3),
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ],
      search: '',
      description: ['', Validators.maxLength(5000)],
      history: ['', [Validators.maxLength(5000)]],
      origin: ['', [Validators.maxLength(20)]],
      nutritions: this.fb.array([]),
      contraindicates: this.fb.array([]),
      precautions: this.fb.array([]),
      compatibleDishes: this.fb.array([]),
      cookingMethods: this.fb.array([]),
      tips: this.fb.array([]),
      storageMethods: this.fb.array([]),
      recommendations: this.fb.array([]),
      sources: this.fb.array([]),
      advantages: this.fb.array([]),
      variations: this.fb.array([]),
      disadvantages: this.fb.array([]),
      image: [null],
    });
  }

  ngOnInit(): void {
    this.addModalStyle();
    this.currentUserInit();
    this.editedIngredientInit();
    this.beginningData = this.form.getRawValue();
  }

  editedIngredientInit() {
    const id = this.editedIngredient.id;
    if (id > 0) {
      this.awaitModal = true;

      const ingredient$ = this.ingredientService
        .getIngredientForEditing(id)
        .pipe(
          tap((ingredient) => {
            this.form.get('ingredientName')?.setValue(ingredient.name);
            this.form.get('description')?.setValue(ingredient.description);
            this.form.get('history')?.setValue(ingredient.history);
            this.form.get('origin')?.setValue(ingredient.origin);
            ingredient.contraindicatedTo?.forEach((element) => {
              this.addBaseTextControl('contraindicates', element);
            });
            ingredient.precautions?.forEach((element) => {
              this.addBaseTextControl('precautions', element);
            });
            ingredient.compatibleDishes?.forEach((element) => {
              this.addBaseTextControl('compatibleDishes', element);
            });
            ingredient.cookingMethods?.forEach((element) => {
              this.addBaseTextControl('cookingMethods', element);
            });
            ingredient.tips?.forEach((element) => {
              this.addBaseTextControl('tips', element);
            });
            ingredient.storageMethods?.forEach((element) => {
              this.addBaseTextControl('storageMethods', element);
            });

            ingredient.advantages?.forEach((element) => {
              this.addBaseTextControl('advantages', element);
            });
            ingredient.disadvantages?.forEach((element) => {
              this.addBaseTextControl('disadvantages', element);
            });

            ingredient.recommendedTo?.forEach((element) => {
              this.addBaseTextControl('recommendations', element);
            });

            if (ingredient.nutritions) {
              for (let i = 1; i <= ingredient.nutritions.length; i++) {
                this.addNutrition();
                const nutritionsArray = this.form.get(
                  'nutritions',
                ) as FormArray;
                const nutritionGroup = nutritionsArray.at(i - 1) as FormGroup;
                const nutritionName = nutritionGroup.get('name') as FormControl;
                const nutritionQuantity = nutritionGroup.get(
                  'quantity',
                ) as FormControl;
                const nutritionUnit = nutritionGroup.get('unit') as FormControl;
                nutritionName?.setValue(ingredient.nutritions[i - 1].name);
                nutritionQuantity?.setValue(
                  ingredient.nutritions[i - 1].quantity,
                );
                nutritionUnit?.setValue(ingredient.nutritions[i - 1].unit);
              }
            }

            if (ingredient.shoppingListGroup) {
              const findedGroup = this.productTypes.find(
                (t) => t.id === ingredient.shoppingListGroup,
              );
              this.selectedType = findedGroup || this.productTypes[0];
              this.searchQuery = this.selectedType.name;
              this.form.get('search')?.setValue(this.selectedType.name);
            }

            if (ingredient.externalLinks) {
              for (let i = 1; i <= ingredient.externalLinks.length; i++) {
                this.addSource();
                const sourcesArray = this.form.get('sources') as FormArray;
                const sourcesGroup = sourcesArray.at(i - 1) as FormGroup;
                const sourceName = sourcesGroup.get('name') as FormControl;
                const sourceLink = sourcesGroup.get('link') as FormControl;
                sourceName?.setValue(ingredient.externalLinks[i - 1].name);
                sourceLink?.setValue(ingredient.externalLinks[i - 1].link);
              }
            }

            this.editedIngredient = ingredient;
          }),
        );

      const variations$ = this.ingredientService
        .getVariations(this.editedIngredient.id)
        .pipe(
          tap((variations) => {
            this.editedIngredient.variations = variations;
            this.editedIngredient.variations?.forEach((element) => {
              this.addBaseTextControl('variations', element);
            });
          }),
        );

      const groups$ = this.ingredientService
        .getGroupsOfIngredient(this.editedIngredient.id)
        .pipe(
          tap((groups) => {
            groups.forEach((group) => {
              this.oldGroupsIds.push(group.id);
              this.selectedIngredientsGroups.push(group);
            });
          }),
        );

      const image$: Observable<any> = this.editedIngredient.image
        ? this.ingredientService
            .downloadImage(this.editedIngredient.image)
            .pipe(
              finalize(() => {
                this.editedIngredient.imageLoading = false;
                this.cd.markForCheck();
              }),
              tap((blob) => {
                if (blob) {
                  this.form.get('image')?.setValue('existing_photo');

                  this.editedIngredient.imageURL = URL.createObjectURL(blob);
                  this.mainImage = this.editedIngredient.imageURL;
                  this.cd.markForCheck();
                }
              }),
              catchError(() => {
                return EMPTY;
              }),
            )
        : of(null);

      forkJoin([ingredient$, variations$, groups$]).subscribe(() => {
        image$
          .pipe(
            finalize(() => {
              this.awaitModal = false;
              this.autocompleteShow = false;
              this.beginningData = this.form.getRawValue();
              this.initialLoading = false;
              addModalStyle(this.renderer);
              this.cd.markForCheck();
            }),
          )
          .subscribe();
      });
    }
    else {
      this.initialLoading = false;
    }
  }

  initialLoading = true;

  getImageOfSavedIngredient() {
    let image = '';
    const selectedImage = this.form.get('image')?.value;
    if (this.editedIngredient.image && selectedImage === 'existing_photo') {
      image = this.editedIngredient.image;
    } else {
      if (selectedImage) {
        image = 'image';
      }
    }
    return image;
  }

  errorModal = false;
  errorModalContent = '';

  private throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }

  handleErrorModal() {
    this.errorModal = false;
    addModalStyle(this.renderer);
  }

  getStatusOfSavedIngredient() {
    return this.currentUser.role === 'user' ? 'awaits' : 'public';
  }

  POSTIngredient(ingredient: IIngredient) {
    const file: File = this.form.value.image;
    this.awaitModal = true;
    this.savedIngredient = ingredient;

    this.ingredientService
      .postIngredient(ingredient)
      .pipe(
        catchError((response: any) => {
          if (response.error.info == 'NAME_EXISTS') {
            this.throwErrorModal(
              'Ингредиент с таким названием уже существует. Измените название и попробуйте снова.',
            );
          } else {
            this.throwErrorModal(
              'Произошла ошибка при попытке создать ингредиент.',
            );
          }
          return of(null);
        }),
        concatMap((response: any) => {
          const insertedId = response.id;
          this.savedIngredient.id = insertedId;

          const observables$ = this.getCreatedIngredientObservables(insertedId);
          const groups$ = observables$.groups;
          const variations$ = observables$.variations;

          const observablesArray = [...groups$, ...variations$];

          return concat(...observablesArray).pipe(
            concatMap(() => {
              if (file) {
                return this.ingredientService.uploadIngredientImage(file).pipe(
                  concatMap((uploadResponse: any) => {
                    const filename = uploadResponse.filename;
                    return this.ingredientService
                      .setImageToIngredient(insertedId, filename)
                      .pipe(
                        catchError(() => {
                          this.throwErrorModal(
                            'Произошла ошибка при попытке связать загруженное изображение и ингредиент.',
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
          this.awaitModal = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successModalShow = true;
        },
      });
  }

  getCreatedIngredientObservables(id: number) {
    const newGroupsIds: number[] = this.selectedIngredientsGroups.map(
      (ingredient) => ingredient.id,
    );
    const groups$ = newGroupsIds.map((groupId) => {
      return this.ingredientService.setGroupToIngredient(groupId, id).pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке связать группу ингредиентов с ингредиентом.',
          );
          return EMPTY;
        }),
      );
    });

    const variations: string[] = this.form.value.variations.map(
      (item: { content: string }) => item.content,
    );

    const variations$ = variations.map((variation) => {
      return this.ingredientService.postVariation(id, variation).pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке создать вариацию названия ингредиента.',
          );
          return EMPTY;
        }),
      );
    });

    return { variations: variations$, groups: groups$ };
  }

  createIngredient() {
    const ingredientByForm = getIngredientByForm(
      this.form,
      this.f('sources').controls,
    );

    const updatedIngredient: IIngredient = {
      ...ingredientByForm,
      author: this.currentUser.id,
      status: this.getStatusOfSavedIngredient(),
      shoppingListGroup: this.selectedType.id,
    };

    this.POSTIngredient(updatedIngredient);
  }

  checkVariationsOfEditedIngredient() {
    const variationsBefore = this.editedIngredient.variations;
    const variationsAfter = this.savedIngredient.variations;

    const variationsChanged =
      JSON.stringify(variationsBefore) !== JSON.stringify(variationsAfter);

    const insert$: Observable<any>[] = [];
    let delete$: Observable<any> = of(null);

    if (variationsChanged) {
        delete$ = this.ingredientService
          .deleteAllVariations(this.editedIngredient.id)
          .pipe(
            catchError(() => {
              this.throwErrorModal(
                'Произошла ошибка при попытке удаления старых вариаций названия ингредиента.',
              );
              return EMPTY;
            }),
          );
      
      if (variationsAfter.length > 0) {
        variationsAfter.forEach((variation) => {
          insert$.push(
            this.ingredientService
              .postVariation(this.editedIngredient.id, variation)
              .pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при попытке добавления новой вариации названия ингредиента.',
                  );
                  return EMPTY;
                }),
              ),
          );
        });
      }
    }
    const observables: Observable<any>[] = [];
    
    insert$.forEach((insertVariation$) => {
      observables.push(insertVariation$);
    });

    return { delete:delete$, observables: observables};
  }

  private PUTIngredient(ingredient: IIngredient) {
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
    this.savedIngredient = ingredient;
    const variations$ =
      this.checkVariationsOfEditedIngredient();
    const deleteVariations$ = variations$.delete;
    const groups$ = this.compareGroups(this.oldGroupsIds);
    const deleteGroups$ = groups$.delete;

    const observables$ =[...variations$.observables, ...groups$.observables].length? [...variations$.observables, ...groups$.observables] : of(null);

    const putIngredient$ = this.ingredientService
      .updateIngredient(ingredient)
      .pipe(
        catchError((response: any) => {
          if (response.error.info == 'NAME_EXISTS') {
            this.throwErrorModal(
              'Ингредиент с таким названием уже существует. Измените название и попробуйте снова.',
            );
          } else {
            this.throwErrorModal(
              'Произошла ошибка при попытке обновить ингредиент.',
            );
          }
          return EMPTY;
        }),
      );

    const loadImage$ = loadImage
      ? this.ingredientService.uploadIngredientImage(file).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке загрузить файл нового изображения ингредиента.',
            );
            return EMPTY;
          }),
          concatMap((response: any) => {
            const filename = response.filename;
            return this.ingredientService
              .setImageToIngredient(ingredient.id, filename)
              .pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при попытке связать новое загруженное изображение и ингредиент.',
                  );
                  return EMPTY;
                }),
              );
          }),
        )
      : of(null);

    const deleteImage$ = deleteImage
      ? this.ingredientService.deleteImage(ingredient.id).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке удалить старое изображение ингредиента.',
            );
            return EMPTY;
          }),
          concatMap(() => {
            return this.ingredientService
              .setImageToIngredient(ingredient.id, '')
              .pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при попытке удаления связи старого изображения с ингредиентом.',
                  );
                  return EMPTY;
                }),
              );
          }),
        )
      : of(null);

    putIngredient$
      .pipe(
        concatMap(() => deleteVariations$),
        concatMap(() => deleteGroups$),
        concatMap(() => forkJoin(observables$)),
        concatMap(() => deleteImage$),
        concatMap(() => loadImage$),

        finalize(() => {
          this.awaitModal = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successModalShow = true;
        },
      });
  }

  editIngredient() {
    const ingredientByForm = getIngredientByForm(
      this.form,
      this.f('sources').controls,
    );

    const updatedIngredient: IIngredient = {
      ...ingredientByForm,
      id: this.editedIngredient.id,
      image: this.getImageOfSavedIngredient(),
      shoppingListGroup: this.selectedType.id,
    };

    this.PUTIngredient(updatedIngredient);
  }

  compareGroups(before: number[]) {
    const after: number[] = this.selectedIngredientsGroups.map(
      (ingredient) => ingredient.id,
    );
    
    const changed = JSON.stringify(before) !== JSON.stringify(after);

    const insert$: Observable<any>[] = [];
    let delete$: Observable<any> = of(null);

    if (changed) {
        delete$ = this.ingredientService
          .deleteAllGroups(this.editedIngredient.id)
          .pipe(
            catchError(() => {
              this.throwErrorModal(
                'Произошла ошибка при попытке удаления старых групп ингредиента.',
              );
              return EMPTY;
            }),
          );
      
      if (after.length > 0) {
        after.forEach((group) => {
          insert$.push(
            this.ingredientService
              .setGroupToIngredient(group, this.editedIngredient.id)
              .pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при попытке добавления новой группы ингредиенту.',
                  );
                  return EMPTY;
                }),
              ),
          );
        });
      }
    }
    const observables: Observable<any>[] = [];
    
    insert$.forEach((insertVariation$) => {
      observables.push(insertVariation$);
    });

    return { delete:delete$, observables: observables};


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
    switch (step) {
      case 0:
        return 'Название ингредиента обязательно, а также он должен содержать как минимум 1 группу ингредиентов';
      case 1:
        break;
      case 2:
        return 'Содержание всех добавленных полей обязательно должны содержать минимум 3 символа';
      case 3:
        return 'Содержание всех добавленных полей обязательно должны содержать минимум 3 символа';

      case 4:
        return 'Название каждого нутриента должно содержать не менее 2 символов';
      case 5:
        return 'Название ссылки и сама ссылка на источник обязательны, а также ссылка должна быть корректной ссылкой на веб-сайт в интернете.';
    }
    return '';
  }

  validNextSteps(): number {
    for (let s = 0; s <= 6; s++) {
      switch (s) {
        case 0:
          if (
            !(
              this.form.get('ingredientName')!.valid &&
              this.form.get('history')!.valid &&
              this.form.get('description')!.valid &&
              this.form.get('variations')!.valid &&
              this.form.get('origin')!.valid &&
              this.selectedIngredientsGroups.length > 0
            )
          ) {
            return 1;
          }
          break;
        case 1:
          if (
            !(
              this.form.get('recommendations')!.valid &&
              this.form.get('contraindicates')!.valid &&
              this.form.get('advantages')!.valid &&
              this.form.get('disadvantages')!.valid
            )
          ) {
            return 2;
          }
          break;
        case 2:
          if (
            !(
              this.form.get('precautions')!.valid &&
              this.form.get('compatibleDishes')!.valid &&
              this.form.get('cookingMethods')!.valid
            )
          ) {
            return 3;
          }
          break;
        case 3:
          if (
            !(
              this.form.get('tips')!.valid &&
              this.form.get('storageMethods')!.valid
            )
          ) {
            return 4;
          }
          break;
        case 4:
          if (!this.form.get('nutritions')!.valid) {
            return 5;
          }
          break;
        case 5:
          if (!this.form.get('sources')!.valid) {
            return 6;
          }
          break;
      }
    }
    return 0;
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.mainImage = this.defaultImage;
  }

  sendNotifyAfterCreatingIngredient() {
    let notification: INotification = nullNotification;

    if (!this.currentUser.id) return;

    if (this.isManager) {
      const createdIngredientLink =
        '/ingredients/list/' + this.savedIngredient.id;

      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.IngredientSend,
        )
      ) {
        if (this.edit) {
          notification = this.notificationService.buildNotification(
            'Ингредиент изменен',
            `Вы успешно изменили ингредиент «${this.savedIngredient.name}»`,
            'success',
            'ingredient',
            createdIngredientLink,
          );
        } else {
          notification = this.notificationService.buildNotification(
            'Ингредиент опубликован',
            `Созданный вами ингредиент «${this.savedIngredient.name}» успешно опубликован`,
            'success',
            'ingredient',
            createdIngredientLink,
          );
        }

        this.notificationService
          .sendNotification(notification, this.currentUser.id, true)
          .subscribe();
      }
    } else {
      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.IngredientSend,
        )
      ) {
        notification = this.notificationService.buildNotification(
          'Ингредиент создан',
          `Созданный вами ингредиент «${this.savedIngredient.name}» успешно создан и отправлен на проверку`,
          'success',
          'ingredient',
          '',
        );
        this.notificationService
          .sendNotification(notification, this.currentUser.id, true)
          .subscribe();
      }
    }
  }

  getNameOfControlGroup(controlGroup: string): string {
    return getNameOfControlGroup(controlGroup);
  }

  getInputPlaceholderOfControlGroup(controlGroup: string): string {
    return getInputPlaceholderOfControlGroup(controlGroup);
  }

  addModalStyle() {
    addModalStyle(this.renderer);
  }

  //модальные окна

  handleExitModal(answer: boolean): void {
    this.exitModalShow = false;

    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      this.addModalStyle();
    }
  }
  handleCreateModal(answer: boolean) {
    if (answer) {
      this.saveIngredient();
    }
    this.createModalShow = false;
    this.addModalStyle();
  }

  private saveIngredient() {
    this.awaitModal = true;
    if (this.edit) {
      this.editIngredient();
    } else {
      this.createIngredient();
    }
  }

  savedIngredient: IIngredient = { ...nullIngredient };

  handleSuccessModal() {
    this.successModalShow = false;
    this.sendNotifyAfterCreatingIngredient();
    this.closeEmitter.emit();

    if (this.edit) {
      this.editEmitter.emit();
    } else {
      this.router.navigateByUrl(`/ingredients/list/${this.savedIngredient.id}`);
    }
  }

  //поиск типа ингредиента
  protected blur(): void {
    if (this.searchQuery !== '' && this.searchQuery !== this.selectedType.name)
      this.searchQuery = '';

    this.autocompleteShow = false;
    this.focused = false;
  }
  protected focus(): void {
    this.autocompleteShow = true;
    this.search();
  }
  protected chooseType(type: ProductType): void {
    this.searchQuery = type.name;
    this.selectedType = type;
  }
  protected search(): void {
    this.autocompleteShow = true;
    this.focused = true;
    if (this.searchQuery) {
      this.autocompleteTypes = [];
      if (this.selectedType.name !== this.searchQuery) {
        const without = this.productTypes.find(
          (p) => p.name === 'Без категории',
        );
        if (without) this.selectedType = without;
      }
      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      const filterTypes: ProductType[] = this.productTypes.filter(
        (type: ProductType) =>
          type.name.toLowerCase().replace(/\s/g, '').includes(search),
      );

      filterTypes.forEach((element) => {
        this.autocompleteTypes.push(element);
      });
    } else this.autocompleteTypes = [...this.productTypes];
  }

  //шаги

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

  //drag drop
  drop(context: string, event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.f(context).controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  areObjectsEqual(): boolean {
    if (this.edit)
      if (
        JSON.stringify(this.oldGroupsIds) !==
        JSON.stringify(this.selectedIngredientsGroups.map((g) => g.id))
      )
        return true;
    if (this.editedIngredient.shoppingListGroup !== this.selectedType.id)
      return true;
    if (this.editedIngredient.image)
      if (this.form.get('image')?.value !== 'existing_photo') return true;
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }
  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.areObjectsEqual()
      ? (this.exitModalShow = true)
      : this.closeEmitter.emit(true);
  }
  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  currentUserInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser));
  }
  isControlValid(control: AbstractControl, field: string) {
    return (
      control.get(field)?.invalid &&
      (control.get(field)?.dirty || control.get(field)?.touched)
    );
  }

  closeIngredientCreating(): void {

    this.areObjectsEqual()
      ? (this.exitModalShow = true)
      : this.closeEmitter.emit(true);
  }

  f(field: string): FormArray {
    return this.form.get(field) as FormArray;
  }

  addGroup(event: IGroup) {
    if (this.selectedIngredientsGroups.length < 5) {
      const findedingredient: IGroup | undefined =
        this.selectedIngredientsGroups.find((group) => group.id === event.id);
      if (findedingredient === undefined) {
        this.selectedIngredientsGroups.push(event);
      }
    }
  }
  removeGroup(event: IGroup) {
    this.selectedIngredientsGroups = this.selectedIngredientsGroups.filter(
      (group) => group.id !== event.id,
    );
  }

  mainPhotoChange(event: any) {
    const input = event.target as HTMLInputElement;
    const file: File | undefined = input.files?.[0];

    if (file && checkFile(file)) {
      this.form.get('image')?.setValue(file);
      const objectURL = URL.createObjectURL(file);
      this.mainImage = objectURL;
    }
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
        quantity: ['', [Validators.maxLength(6)]],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }
  addSource() {
    this.f('sources').push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            trimmedMinLengthValidator(2),
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        link: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            trimmedMinLengthValidator(5),
            Validators.maxLength(1000),
          ],
          customLinkPatternValidator(anySiteMask),
        ],
      }),
    );
  }

  addBaseTextControl(controlGroup: string, value?: string) {
    let maxLength = 500;
    if (controlGroup === 'variations') maxLength = 50;
    this.f(controlGroup).push(
      this.fb.group({
        content: [
          value || '',
          [
            Validators.required,
            Validators.minLength(3),
            trimmedMinLengthValidator(3),
            Validators.maxLength(maxLength),
          ],
        ],
      }),
    );
  }

  removeBaseTextControl(index: number, controlGroup: string) {
    this.f(controlGroup).removeAt(index);
  }

  submitForm(): void {
    this.createModalShow = true;
  }
}
