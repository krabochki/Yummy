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
} from './consts';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { EMPTY, Observable, Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, takeUntil, tap } from 'rxjs/operators';
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
  ExternalLink,
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
import {
  addModalStyle,
  getCurrentDate,
  removeModalStyle,
} from 'src/tools/common';
import { GroupService } from '../../../services/group.service';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

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
  @Input() editedIngredient: IIngredient = nullIngredient;
  @Output() editEmitter = new EventEmitter();
  @Output() closeEmitter = new EventEmitter<boolean>();

  form: FormGroup;

  currentUser: IUser = nullUser;
  productTypes = productTypes;

  createdIngredient: IIngredient = nullIngredient;
  oldGroupsIds: number[] = [];

  currentStep: number = 0;
  showInfo = false;
  steps: Step[] = steps;
  stepControlGroups = stepControlGroups;
  selectedIngredientsGroups: IGroup[] = [];

  autocompleteTypes: ProductType[] = [];
  selectedType: ProductType = productTypes[0];

  loading = false;
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
          this.loading = true;

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

      const image$ = this.editedIngredient.image
        ? this.ingredientService
            .downloadImage(this.editedIngredient.image)
            .pipe(
              finalize(() => {
                this.editedIngredient.imageLoading = false;
                this.cd.markForCheck();
              }),
              tap((blob) => {
                if (blob) {
                  this.form.get('image')?.setValue('url');

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

      forkJoin(ingredient$, variations$, groups$, image$).subscribe(() => {
        this.loading = false;

        this.autocompleteShow = false;
        this.cd.markForCheck();
        this.beginningData = this.form.getRawValue();
      });
    }
  }

  private newIngredientInit(): IIngredient {
    let image = '';

    if (
      this.editedIngredient.image &&
      this.form.get('image')?.value === 'url'
    ) {
      image = this.editedIngredient.image;
    } else {
      if (this.form.get('image')?.value) {
        image = 'image';
      }
    }
    const externalLinks: ExternalLink[] = [];
    this.f('sources').controls.forEach((control) => {
      const externalLink: ExternalLink = {
        link: control.get('link')?.value,
        name: control.get('name')?.value,
      };
      externalLinks.push(externalLink);
    });

    const ingredient: IIngredient = {
      id: this.edit ? this.editedIngredient.id : 0,
      name: this.form.value.ingredientName,
      history: this.form.value.history,
      description: this.form.value.description,
      author: this.edit ? this.editedIngredient.author : this.currentUser.id,
      sendDate: this.edit ? this.editedIngredient.sendDate : getCurrentDate(),
      variations: this.form.value.variations.map(
        (item: { content: string }) => item.content,
      ),
      status: this.edit ? 'public' : this.isManager ? 'public' : 'awaits',
      image: image,
      advantages: this.form.value.advantages.map(
        (item: { content: string }) => item.content,
      ),
      disadvantages: this.form.value.disadvantages.map(
        (item: { content: string }) => item.content,
      ),
      recommendedTo: this.form.value.recommendations.map(
        (item: { content: string }) => item.content,
      ),
      contraindicatedTo: this.form.value.contraindicates.map(
        (item: { content: string }) => item.content,
      ),
      origin: this.form.value.origin,
      precautions: this.form.value.precautions.map(
        (item: { content: string }) => item.content,
      ),
      compatibleDishes: this.form.value.compatibleDishes.map(
        (item: { content: string }) => item.content,
      ),
      cookingMethods: this.form.value.cookingMethods.map(
        (item: { content: string }) => item.content,
      ),
      tips: this.form.value.tips.map(
        (item: { content: string }) => item.content,
      ),
      nutritions: this.form.value.nutritions,
      storageMethods: this.form.value.storageMethods.map(
        (item: { content: string }) => item.content,
      ),
      externalLinks: externalLinks,
      shoppingListGroup: this.selectedType.id,
    };

    return ingredient;
  }

  ingredientAction(): void {
    if (this.form.valid && this.selectedIngredientsGroups.length > 0) {
      this.createdIngredient = this.newIngredientInit();

      this.loading = true;
      this.cd.markForCheck();

      if (this.edit) {
        this.editIngredient();
      } else {
        this.createIngredient();
      }
    }
  }

  handleIngredientSuccessCreating() {
    this.loading = false;
    this.successModalShow = true;
    this.cd.markForCheck();
  }

  postIngredient(ingredient: IIngredient) {
    this.ingredientService
      .postIngredient(ingredient)
      .pipe(
        tap((response: any) => {
          const newId = response.id;
          ingredient.id = newId;
          const newGroupsIds: number[] = this.selectedIngredientsGroups.map(
            (ingredient) => ingredient.id,
          );
          const groups$ = newGroupsIds.map((groupId) => {
            return this.ingredientService.setGroupToIngredient(
              groupId,
              ingredient.id,
            );
          });

          const variations: string[] = this.form.value.variations.map(
            (item: { content: string }) => item.content,
          );

          const variations$ = variations.map((variation) => {
            return this.ingredientService.postVariation(newId, variation);
          });

          const observables = [...variations$, ...groups$];

          forkJoin(observables)
            .pipe(
              tap(() => {
                if (ingredient.image && this.currentUser.role !== 'user') {
                  this.ingredientService
                    .downloadImage(ingredient.image)
                    .subscribe({
                      next: (blob) => {
                        ingredient.imageURL = URL.createObjectURL(blob);
                      },
                      error: () => {
                        ingredient.imageURL = '';
                      },
                      complete: () => {
                        this.handleIngredientSuccessCreating();
                      },
                    });
                } else {
                  this.handleIngredientSuccessCreating();
                }
              }),
            )
            .subscribe();
        }),
        catchError((response) => {
          if (ingredient.image) {
            this.ingredientService
              .deleteImage(ingredient.image)
              .pipe(
                catchError(() => {
                  this.error =
                    'Произошла ошибка при попытке удалить новую фотографию незагруженной категории';
                  this.errorModal = true;
                  return EMPTY;
                }),
              )
              .subscribe();
          }
          this.error = response.error.info || '';
          this.errorModal = true;
          this.loading = false;
          this.cd.markForCheck();
          return EMPTY;
        }),
      )
      .subscribe();
  }

  error = '';
  errorModal: boolean = false;

  createIngredient() {
    if (this.form.value.image) {
      this.ingredientService
        .uploadIngredientImage(this.form.get('image')?.value)
        .subscribe((res: any) => {
          const filename = res.filename;
          this.createdIngredient.image = filename;
          this.postIngredient(this.createdIngredient);
        });
    } else {
      this.postIngredient(this.createdIngredient);
    }
  }

  checkVariationsOfEditedIngredient(): {
    delete: Observable<any>;
    insert: Observable<any>[];
  } {
    const variationsBefore = this.editedIngredient.variations;
    const variationsAfter = this.createdIngredient.variations;
    const variationsChanged =
      JSON.stringify(variationsBefore) !== JSON.stringify(variationsAfter);

    const insert$: Observable<any>[] = [];
    let delete$: Observable<any> = of(null);

    if (variationsChanged) {
      if (variationsBefore.length > 0) {
        delete$ = this.ingredientService.deleteAllVariations(
          this.editedIngredient.id,
        );
      }
      if (variationsAfter.length > 0) {
        variationsAfter.forEach((variation) => {
          insert$.push(
            this.ingredientService.postVariation(
              this.editedIngredient.id,
              variation,
            ),
          );
        });
      }
    }
    return { delete: delete$, insert: insert$ };
  }

  checkImagesOfEditedIngredient() {
    let loadImage = false;
    let deleteImage = false;

    if (this.editedIngredient.image !== this.createdIngredient.image) {
      if (this.createdIngredient.image) {
        loadImage = true;
      }
      if (this.editedIngredient.image) {
        deleteImage = true;
      }
    }
    const images$ = [];
    if (loadImage) {
      images$.push(
        this.ingredientService
          .uploadIngredientImage(this.form.get('image')?.value)
          .pipe(
            tap((response: any) => {
              const filename = response.filename;
              this.createdIngredient.image = filename;
              console.log('load image');
            }),
            catchError((response) => {
              this.error = response.error.info || '';
              this.loading = false;
              this.errorModal = true;
              this.cd.markForCheck();
              return EMPTY;
            }),
          ),
      );
    }

    if (deleteImage && this.editedIngredient.image) {
      images$.push(
        this.ingredientService.deleteImage(this.editedIngredient.image),
      );
    }

    return images$;
  }

  editIngredientAfterImageLoading() {
    const variations$ = this.checkVariationsOfEditedIngredient();
    if (this.createdIngredient.image === ('url' || 'image')) {
      this.createdIngredient.image = '';
    }
    const putingredient$ = this.ingredientService.updateIngredient(
      this.createdIngredient,
    );
    const groups$: Observable<any>[] = this.compareGroups(this.oldGroupsIds);

    const subscribes$ = [putingredient$, variations$.delete, ...groups$];

    forkJoin(subscribes$)
      .pipe(
        finalize(() => {
          forkJoin(variations$.insert)
            .pipe(
              finalize(() => {
                this.loading = false;
                this.cd.markForCheck();
                this.closeEmitter.emit();
                this.editEmitter.emit();
              }),
            )
            .subscribe();
        }),
        catchError((error) => {
          console.error('Error occurred:', error);
          this.error = '';
          this.errorModal = true;
          this.loading = false;
          this.cd.markForCheck();
          return EMPTY;
        }),
      )
      .subscribe(() => {});
  }

  editIngredient() {
    const images$ = this.checkImagesOfEditedIngredient();
    if (images$.length) {
      forkJoin(images$).subscribe(() => {
        this.editIngredientAfterImageLoading();
      });
    } else {
      this.editIngredientAfterImageLoading();
    }
  }

  compareGroups(before: number[]) {
    const after: number[] = this.selectedIngredientsGroups.map(
      (ingredient) => ingredient.id,
    );
    const added = after.filter((num) => !before.includes(num));
    const removed = before.filter((num) => !after.includes(num));
    const subscribes: Observable<any>[] = [];

    added.forEach((addedGroupId) => {
      subscribes.push(
        this.ingredientService.setGroupToIngredient(
          addedGroupId,
          this.createdIngredient.id,
        ),
      );
    });
    removed.forEach((removedGroupId) => {
      subscribes.push(
        this.ingredientService.unsetGroupInIngredient(
          this.createdIngredient.id,
          removedGroupId,
        ),
      );
    });
    return subscribes;
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

    if (this.isManager) {
      const createdIngredientLink =
        '/ingredients/list/' + this.createdIngredient.id;
      // if (
      //   this.userService.getPermission(
      //     'your-ingredient-published',
      //     this.currentUser,
      //   )
      // ) {
      
      if (this.userService.getPermission(this.currentUser.limitations || [], Permission.IngredientSend)) {

        notification = this.notificationService.buildNotification(
          'Ингредиент опубликован',
          `Созданный вами ингредиент «${this.createdIngredient.name}» успешно опубликован`,
          'success',
          'ingredient',
          createdIngredientLink,
        );

        this.notificationService
          .sendNotification(notification, this.currentUser.id, true)
          .subscribe(
        );
      }
        this.router.navigateByUrl(createdIngredientLink);
              //}
              
    } else {
      if (this.userService.getPermission(this.currentUser.limitations || [], Permission.IngredientSend)) {

        notification = this.notificationService.buildNotification(
          'Ингредиент создан',
          `Созданный вами ингредиент «${this.createdIngredient.name}» успешно создан и отправлен на проверку`,
          'success',
          'ingredient',
          '',
        );
        this.notificationService
          .sendNotification(notification, this.currentUser.id, true)
          .subscribe();
        //}
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
      this.ingredientAction();
    } else {
      this.addModalStyle();
    }
    this.createModalShow = false;
  }
  handleSuccessModal() {
    this.successModalShow = false;
    this.closeEmitter.emit();
    if (this.edit) {
      this.editEmitter.emit();
    }
    this.sendNotifyAfterCreatingIngredient();
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
      if (this.editedIngredient.shoppingListGroup !== this.selectedType.id)
        return true;
    if (this.editedIngredient.image)
      if (this.form.get('image')?.value !== 'url') return true;
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
    if (
      !this.areObjectsEqual() &&
      this.selectedIngredientsGroups.length === 0
    ) {
      this.closeEmitter.emit();
    } else {
      this.exitModalShow = true;
    }
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
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
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
