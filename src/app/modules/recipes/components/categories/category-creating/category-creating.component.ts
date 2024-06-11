/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterContentChecked,
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
import {
  EMPTY,
  Subject,
  Subscription,
  catchError,
  concatMap,
  finalize,
  forkJoin,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { SectionService } from '../../../services/section.service';
import {
  addModalStyle,
  removeModalStyle,
} from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { checkFile } from '../../../../../../tools/error.handler';

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
  awaitModal = false;

  //init data
  currentUser: IUser = { ...nullUser };
  startSection: ISection = nullSection;

  errorModal = false;
  errorModalContent = '';
  //images
  categoryImage: string = '';
  defaultImage: string = '/assets/images/add-category.png';

  //form
  form: FormGroup;
  beginningData: any;

  editedCategory: ICategory = { ...nullCategory };
  savedCategory: ICategory = { ...nullCategory };

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

  @HostListener('window:beforeunload')
  canDeactivate() {
    if (this.areObjectsEqual())
      return confirm(
        'Вы уверены, что хотите покинуть страницу? Все несохраненные изменения будут потеряны.',
      );
    else return true;
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  public ngOnInit(): void {
    addModalStyle(this.renderer);
    this.editedCategoryInit();
    this.currentUserInit();
  }

  subscriptions = new Subscription();
  private editedCategoryInit() {
    if (this.editMode) {
      this.initialLoading = true;
      this.cdr.markForCheck();
      this.subscriptions.add(
        this.categoryService
          .getCategoryForEditing(this.editedCategoryId)
          .pipe(
            takeUntil(this.destroyed$),
            tap((category) => {
              this.editedCategory.id = category.id;
              const image$ = category.image
                ? this.categoryService.downloadImage(category.image).pipe(
                    tap((blob) => {
                      if (blob) {
                        this.form.get('image')?.setValue('existing_photo');
                        this.editedCategory.image = category.image;
                        this.editedCategory.imageURL =
                          URL.createObjectURL(blob);
                        this.categoryImage = this.editedCategory.imageURL;
                        this.cdr.markForCheck();
                      }
                    }),
                    catchError(() => {
                      this.errorModalContent =
                        'Возникла ошибка при попытке загрузить файл с изображением редактируемой категории. Возможны сбои при попытке изменить категорию.';
                      this.errorModal = true;
                      return EMPTY;
                    }),
                  )
                : of(null);

              this.form.get('name')?.setValue(category.name);

              this.editedCategory.sectionId = category.sectionId;

              const section: ISection = {
                ...nullSection,
                id: category.sectionId || 0,
                name: category.sectionName || '',
              };
              this.form.get('section')?.setValue(section);
              this.startSection = section;
              this.subscriptions.add(
                forkJoin([image$])
                  .pipe(
                    finalize(() => {
                      this.initialLoading = false;
                      addModalStyle(this.renderer);
                      this.beginningData = this.form.getRawValue();

                      this.cdr.markForCheck();
                    }),
                  )
                  .subscribe(() => {}),
              );
            }),
          )
          .subscribe(),
      );
    }
  }

  private currentUserInit() {
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data: IUser) => {
          this.currentUser = data;
        }),
    );
  }

  //section
  clearSection(): void {
    this.form.get('section')?.setValue(null);
  }
  selectSection(selectedSection: ISection): void {
    this.form.get('section')?.setValue(selectedSection);
  }

  private editCategory() {
    const id = this.editedCategory.id;
    const sectionId = this.form.get('section')?.value.id;
    const name = this.form.value.name;
    const updatedCategory: ICategory = {
      ...nullCategory,
      id: id,
      name: name,
      image: this.getImageOfSavedCategory(),
      sectionId: sectionId,
    };
    this.PUTCategory(updatedCategory);
  }

  private createCategory() {
    const sectionId = this.form.get('section')?.value.id;
    const name = this.form.value.name;
    const createdCategory: ICategory = {
      ...nullCategory,
      name: name,
      authorId: this.currentUser.id,
      status: this.getStatusOfSavedCategory(),
      sectionId: sectionId,
    };
    this.POSTCategory(createdCategory);
  }

  handleCategorySuccessLoading() {
    this.successModal = true;
  }

  POSTCategory(category: ICategory) {
    const file: File = this.form.value.image;

    this.savedCategory = category;
    this.categoryService
      .postCategory(category)
      .pipe(
        catchError((response: any) => {
          if (response.error.info == 'NAME_EXISTS') {
            this.throwErrorModal(
              'Категория с таким названием уже существует. Измените название и попробуйте снова.',
            );
          } else {
            this.throwErrorModal(
              'Произошла ошибка при попытке добавить категорию',
            );
          }
          return EMPTY;
        }),
        switchMap((response: any) => {
          const insertedId = response.id; // Сохраняем вставленный ID
          this.savedCategory.id = insertedId;

          // Если есть файл, загружаем изображение
          if (file) {
            return this.categoryService.uploadCategoryImage(file).pipe(
              switchMap((uploadResponse: any) => {
                const filename = uploadResponse.filename;
                // Устанавливаем изображение для категории
                return this.categoryService
                  .setImageToCategory(insertedId, filename)
                  .pipe(
                    catchError(() => {
                      this.throwErrorModal(
                        'Произошла ошибка при попытке связать загруженное изображение и категорию',
                      );
                      return EMPTY;
                    }),
                  );
              }),
            );
          } else {
            // Если файла нет, возвращаем пустой поток
            return of(null);
          }
        }),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.awaitModal = false; // Скрываем модальное окно ожидания
          this.cdr.markForCheck();
        }),
        tap(() => {
          this.successModal = true; // Устанавливаем флаг успешного выполнения операций
        }),
      )
      .subscribe();
  }

  PUTCategory(category: ICategory) {
    let loadImage = false;
    let deleteImage = false;

    const image = this.form.value.image;

    if (image === null) {
      deleteImage = true;
    } else if (image !== 'existing_photo') {
      loadImage = true;
      deleteImage = true;
    }

    this.savedCategory = category;

    const file: File = this.form.value.image;

    const putCategory$ = this.categoryService.putCategory(category).pipe(
      catchError((response: any) => {
        if (response.error.info == 'NAME_EXISTS') {
          this.throwErrorModal(
            'Категория с таким названием уже существует. Измените название и попробуйте снова.',
          );
        } else {
          this.throwErrorModal(
            'Произошла ошибка при попытке обновить категорию',
          );
        }
        return EMPTY;
      }),
    );

    const loadImage$ = loadImage
      ? this.categoryService.uploadCategoryImage(file).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке загрузить файл нового изображения категории',
            );
            return EMPTY;
          }),
          concatMap((response: any) => {
            const filename = response.filename;
            return this.categoryService
              .setImageToCategory(category.id, filename)
              .pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при попытке связать новое загруженное изображение и категорию',
                  );
                  return EMPTY;
                }),
              );
          }),
        )
      : of(null);

    const deleteImage$ = deleteImage
      ? this.categoryService.deleteImage(category.id).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке удалить старое изображение категории',
            );
            return EMPTY;
          }),
          concatMap(() => {
            return this.categoryService
              .setImageToCategory(category.id, '')
              .pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при попытке удаления связи старого изображения с категорией',
                  );
                  return EMPTY;
                }),
              );
          }),
        )
      : of(null);

    putCategory$
      .pipe(
        concatMap(() => deleteImage$),
        concatMap(() => loadImage$),
      )
      .pipe(
        finalize(() => {
          this.awaitModal = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successModal = true;
        },
      });
  }

  private throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }

  handleErrorModal() {
    this.errorModal = false;
    addModalStyle(this.renderer);
  }

  private saveCategory() {
    this.awaitModal = true;
    if (this.editMode) {
      this.editCategory();
    } else {
      this.createCategory();
    }
  }

  //modals
  handleSaveModal(answer: boolean) {
    if (answer) {
      this.saveCategory();
    }
    this.saveModal = false;
    addModalStyle(this.renderer);
  }

  handleSuccessModal() {
    this.closeEmitter.emit(true);
    if (this.currentUser.role !== 'user') this.editEmitter.emit();
    this.successModal = false;
    if (this.editedCategory.id === 0) {
      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.CategorySend,
        )
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          this.currentUser.role === 'user'
            ? 'Категория отправлена на проверку'
            : 'Категория опубликована',
          `Добавленная вами категория «${this.savedCategory.name}» ${
            this.currentUser.role === 'user'
              ? 'отправлена на проверку'
              : 'успешно опубликована'
          }`,
          'success',
          'category',
          this.currentUser.role === 'user'
            ? ''
            : '/categories/list/' + this.savedCategory.id,
        );
        this.notifyService
          .sendNotification(notify, this.currentUser.id, true)
          .subscribe();
      }
    }
  }

  handleCloseModal(answer: boolean) {
    this.closeModal = false;

    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      addModalStyle(this.renderer);
    }
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
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
    removeModalStyle(this.renderer);
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pictureFile: File | undefined = input.files?.[0];

    if (pictureFile && checkFile(pictureFile)) {
      this.form.get('image')?.setValue(pictureFile);
      const objectURL = URL.createObjectURL(pictureFile);
      this.categoryImage = objectURL;
    }
  }
  unsetImage(): void {
    this.form.get('image')?.setValue(null);
    this.categoryImage = this.defaultImage;
  }

  getImageOfSavedCategory() {
    let image = '';
    const selectedImage = this.form.get('image')?.value;
    if (this.editedCategory.image && selectedImage === 'existing_photo') {
      image = this.editedCategory.image;
    } else {
      if (selectedImage) {
        image = 'image';
      }
    }
    return image;
  }

  getStatusOfSavedCategory() {
    return this.editMode
      ? 'public'
      : this.currentUser.role === 'user'
        ? 'awaits'
        : 'public';
  }
}
