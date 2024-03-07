/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterContentChecked,
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
import { steps, Step } from './consts';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { CategoryService } from '../../../services/category.service';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ICategory,
  ISection,
  nullCategory,
  nullSection,
} from '../../../models/categories';
import { SectionGroup } from 'src/app/modules/controls/autocomplete/autocomplete.component';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  takeUntil,
  tap,
} from 'rxjs';
import { SectionService } from '../../../services/section.service';
import {
  addModalStyle,
  getCurrentDate,
  removeModalStyle,
} from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { hi } from 'date-fns/locale';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

@Component({
  selector: 'app-category-creating',
  templateUrl: './category-creating.component.html',
  styleUrls: ['../../../../styles/forms.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCreatingComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() editEmitter = new EventEmitter();
  @Input() editedCategoryId: number = 0;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  //modals
  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  awaitModalShow = false;

  private newCategory: ICategory = { ...nullCategory };

  //init data
  sections: ISection[] = [];
  group: SectionGroup[] = [];
  currentUser: IUser = { ...nullUser };
  startSection: ISection = nullSection;

  errorModal = false;
  error = '';
  //images
  categoryImage: string = '';
  defaultImage: string = '/assets/images/add-category.png';

  //form
  form: FormGroup;
  beginningData: any;

  editedCategory: ICategory = nullCategory;

  currentStep: number = 0;
  steps: Step[] = steps;

  initialLoading = false;

  showInfo = false;

  protected destroyed$: Subject<void> = new Subject<void>();

  get editMode() {
    return this.editedCategoryId > 0;
  }

  constructor(
    private notifyService: NotificationService,
    private renderer: Renderer2,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private sectionService: SectionService,
    private authService: AuthService,
    private categoryService: CategoryService,
  ) {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          trimmedMinLengthValidator(4),
          Validators.maxLength(30),
        ],
      ],
      section: [null, [Validators.required]],
      image: [null],
    });
    this.categoryImage = this.defaultImage;
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  public ngOnInit(): void {
    addModalStyle(this.renderer);
    this.editedCategoryInit();
    this.currentUserInit();
  }

  private editedCategoryInit() {
    if (this.editMode) {
      this.initialLoading = true;
      this.cdr.markForCheck();
      this.categoryService
        .getCategoryForEditing(this.editedCategoryId)
        .pipe(
          tap((category) => {
            this.editedCategory.id = category.id;
            const image$ = category.image
              ? this.categoryService.downloadImage(category.image).pipe(
                  tap((blob) => {
                    if (blob) {
                      this.form.get('image')?.setValue('url');
                      this.editedCategory.image = category.image;
                      this.editedCategory.imageURL = URL.createObjectURL(blob);
                      this.categoryImage = this.editedCategory.imageURL;
                      this.cdr.markForCheck();
                    }
                  }),
                  catchError(() => {
                    return EMPTY;
                  }),
                )
              : of(null);

            this.form.get('name')?.setValue(category.name);

            const section$ = this.sectionService
              .getSectionShortInfoForAwaitingCategory(category.sectionId || 0)
              .pipe(
                tap((sections: ISection[]) => {
                  const section = sections[0];
                  if (section) {
                    this.form.get('section')?.setValue(section);
                    this.startSection = section;
                  }
                }),
              );

            forkJoin([section$, image$])
              .pipe(
                finalize(
                  () => {
                                  this.initialLoading = false;
                                  addModalStyle(this.renderer);
                                  this.beginningData = this.form.getRawValue();

                                  this.cdr.markForCheck();

                  }
                )
              )
              .subscribe(() => {
            });

          }),
        )
        .subscribe();
    }
  }

  private currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
      });
  }

  //images
  onCategoryImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.categoryImage = objectURL;
    }
  }
  unsetCategoryImage(): void {
    this.form.get('image')?.setValue(null);
    this.categoryImage = this.defaultImage;
  }

  //section
  clearSection(): void {
    this.form.get('section')?.setValue(null);
  }
  selectSection(selectedSection: ISection): void {
    this.form.get('section')?.setValue(selectedSection);
  }

  createCategory() {
        this.awaitModalShow = true;
        this.cdr.markForCheck();

        let loadImage = false;
        let deleteImage = false;
        if (this.editMode) {
          if (this.editedCategory.image !== this.newCategory.image) {
            if (this.newCategory.image) {
              loadImage = true;
            }
            if (this.editedCategory.image) {
              deleteImage = true;
            }
          }

                  
          let loadImage$: Observable<any> = of(null);

          try {
            loadImage$ = loadImage
              ? this.categoryService
                  .uploadCategoryImage(this.form.get('image')?.value)
                  .pipe(
                    map((response: any) => {
                      const filename = response.filename;
                      this.newCategory.image = filename;

                    }),
                  )
              : of(null);
          } catch {
            this.error =
              'Произошла ошибка при попытке загрузки картинки категории';
            this.errorModal = true;
            this.awaitModalShow = false;
            this.cdr.markForCheck();
          }

          const deleteImage$ =
            deleteImage && this.editedCategory.image
              ? this.categoryService.deleteImage(this.editedCategory.image)
              : of(null);
          const putCategory$ = this.categoryService.updateCategory(
            this.newCategory,
          );

          forkJoin([loadImage$, deleteImage$])
            .pipe(
              map(() => {
                putCategory$
                  .pipe(
                    tap(() => {
                    console.log(this.newCategory)
                      this.successModal = true;
                      this.cdr.markForCheck();
                    }),

                    catchError((response) => {
                      if (loadImage && this.newCategory.image) {
                        this.sectionService
                          .deleteImage(this.newCategory.image)
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
                      this.cdr.markForCheck();
                      return EMPTY;
                    }),

                    finalize(() => {
                      this.awaitModalShow = false;
                      this.cdr.markForCheck();
                    }),
                  )
                  .subscribe();
              }),
            )
            .subscribe();
        } else {
          if (this.form.get('image')?.value) {
            this.categoryService
              .uploadCategoryImage(this.form.get('image')?.value)
              .subscribe((res: any) => {
                const filename = res.filename;
                this.newCategory.image = filename;
                this.postCategory();
              });
          } else {
            this.postCategory();
          }
        }

  }

   addCategory() {
    this.awaitModalShow = true;
    this.cdr.markForCheck();

    if (this.editMode) {
      let loadImage = false;
      let deleteImage = false;

      if (this.editedCategory.image !== this.newCategory.image) {
        if (this.newCategory.image) {
          loadImage = true;
        }
        if (this.editedCategory.image) {
          console.log(true);
          deleteImage = true;
        }
      }
      if (this.newCategory.image === 'image') this.newCategory.image = '';

      let loadImage$: Observable<any> = of(null);
      try {
        loadImage$ = loadImage
          ? this.categoryService
              .uploadCategoryImage(this.form.get('image')?.value)
              .pipe(
                map((response: any) => {
                  const filename = response.filename;
                  this.newCategory.image = filename;
                }),
                catchError((response) => {
                  this.error = response.error.info || '';
                  this.awaitModalShow = false;
                  this.errorModal = true;

                  this.cdr.markForCheck();
                  return EMPTY;
                }),
              )
          : of(null);
      } catch (error) {
        this.error = 'Произошла ошибка при попытке загрузки картинки категории';
        this.errorModal = true;
        this.awaitModalShow = false;
        this.cdr.markForCheck();
      }

      const deleteImage$ =
        deleteImage && this.editedCategory.image
          ? this.categoryService.deleteImage(this.editedCategory.image)
          : of(null);
      const putCategory$ = this.categoryService.updateCategory(
        this.newCategory,
      );

      try {
        forkJoin([loadImage$, deleteImage$])
          .pipe(
            map(() => {
              putCategory$
                .pipe(
                  catchError((response) => {
                    if (loadImage && this.newCategory.image) {
                      this.categoryService
                        .deleteImage(this.newCategory.image)
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
                    return EMPTY;
                  }),
                  finalize(() => {
                    this.awaitModalShow = false;
                    this.cdr.markForCheck();
                  }),
                )
                .subscribe();
            }),
          )
          .subscribe(() => {});
      } catch {
        this.errorModal = true;
        this.awaitModalShow = false;
        this.cdr.markForCheck();
      }
    } else {
      if (this.form.value.image) {
        this.categoryService
          .uploadCategoryImage(this.form.get('image')?.value)
          .subscribe((res: any) => {
            const filename = res.filename;
            this.newCategory.image = filename;
            this.postCategory();
          });
      } else {
        this.postCategory();
      }
    }
  }

  handleCategorySuccessLoading() {
    this.successModal = true;
  }
  postCategory() {
    this.categoryService
      .postCategory(this.newCategory)
      .pipe(
        tap(() => {
          this.handleCategorySuccessLoading();
        }),
        catchError((response) => {
          if (this.newCategory.image) {
            this.categoryService
              .deleteImage(this.newCategory.image)
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
          return EMPTY;
        }),
        finalize(() => {
          this.awaitModalShow = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe();
  }

  //modals
  handleSaveModal(answer: boolean) {
    if (answer) {
      let image = '';
      if (this.editedCategory.image && this.form.get('image')?.value === 'url') {
        image = this.editedCategory.image;
      } else {
        if (this.form.get('image')?.value) {
          image = 'image';
        }
      }
      this.newCategory = {
        ...nullCategory,
        image: image,
        sectionId: this.form.get('section')?.value.id,
        name: this.form.value.name,
        status: this.editMode
          ? 'public'
          : this.currentUser.role === 'user'
            ? 'awaits'
            : 'public',

        id: this.editMode ? this.editedCategory.id : 0,
      };

        this.createCategory();
      
    
    }
    addModalStyle(this.renderer);
    this.saveModal = false;
  }
  handleSuccessModal() {
    this.closeEmitter.emit(true);
    if (this.currentUser.role !== 'user') this.editEmitter.emit();
    this.successModal = false;
    if (this.editedCategory.id === 0) {

      if (this.userService.getPermission(this.currentUser.limitations || [], Permission.CategorySend)) {
        //.getPermission('you-create-category',) &&
      
      
        const notify: INotification = this.notifyService.buildNotification(
          this.currentUser.role === 'user'
            ? 'Категория отправлена на проверку'
            : 'Категория опубликована',
          `Созданная вами категория «${this.newCategory.name}» ${this.currentUser.role === 'user'
            ? 'отправлена на проверку'
            : 'успешно опубликована'
          }`,
          'success',
          'category',
          this.currentUser.role === 'user'
            ? ''
            : '/categories/list/' + this.newCategory.id,
        );
        this.notifyService
          .sendNotification(notify, this.currentUser.id, true)
          .subscribe();
      
      }
    }
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      addModalStyle(this.renderer);
    }
    this.closeModal = false;
  }

  closeEditModal() {
    this.areObjectsEqual() 
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEditModal();
  }

  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  //steps

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.scrollTop();
    }
  }
  notValid() {
    return this.validNextSteps();
  }
  clickOnCircleStep(i: number) {
    if (this.validNextSteps() === 0 || this.validNextSteps() > i) {
      this.currentStep = i;
      this.scrollTop();
    }
  }
  noValidStepDescription(step: number): string {
    switch (step) {
      case 0:
        return 'Название категории обязательно и должно содержать от 3 до 100 символов';
      case 1:
        return 'Каждая категория обязательно должна иметь раздел';
    }
    return '';
  }

  buttonDisabled() {
    return (
      this.currentStep === this.validNextSteps() - 1 ||
      this.currentStep === steps.length - 1
    );
  }

  validNextSteps(): number {
    for (let s = 0; s <= 1; s++) {
      switch (s) {
        case 0:
          if (!this.form.get('name')!.valid) {
            return 1;
          }
          break;
        case 1:
          if (!this.form.get('section')!.valid) {
            return 2;
          }
          break;
      }
    }
    return 0;
  }

  scrollTop(): void {
    if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
  }
  goToNextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.scrollTop();
    }
  }

  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
  }
}
