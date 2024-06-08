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
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {  ISection, nullSection } from '../../../models/categories';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  concatMap,
  finalize,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { checkFile } from 'src/tools/error.handler';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { INotification, nullNotification } from 'src/app/modules/user-pages/models/notifications';

@Component({
  selector: 'app-section-creating',
  templateUrl: './section-creating.component.html',
  styleUrls: ['../../../../styles/forms.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCreatingComponent implements OnInit, OnDestroy {
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() editEmitter = new EventEmitter<ISection>();
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  protected destroyed$: Subject<void> = new Subject<void>();

  currentUser = { ...nullUser };

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  awaitModal: boolean = false;
  errorModal = false;
  errorModalContent = '';

  savedSection: ISection = { ...nullSection };

  sectionImage: string = '';
  defaultImage: string = '/assets/images/add-section.png';

  form: FormGroup;
  beginningData: any;

  @Input() editedSection: ISection = { ...nullSection };

  editedCategoryDataLoaded = false;

  get edit() {
    return this.editedSection.id > 0;
  }

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private renderer: Renderer2,
    private notifyService: NotificationService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private sectionService: SectionService,
  ) {
    this.form = this.fb.group({
      form: [],
      name: [
        '',
        [
          trimmedMinLengthValidator(4),
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(30),
        ],
      ],
      image: [null],
    });
    this.sectionImage = this.defaultImage;
  }

  private initEditedSection() {
    if (this.edit) {

      this.sectionService.getSectionForEditing(this.editedSection.id)
        .pipe(
          tap(
            (section) => {
              this.editedSection = section;
              this.form.get('name')?.setValue(this.editedSection.name);

              let loadImage$: Observable<any> = of(null);
              if (this.editedSection.image) {
                loadImage$ = this.sectionService
                  .downloadImage(this.editedSection.image)
                  .pipe(
                    tap((blob) => {
                      this.editedSection.imageURL = URL.createObjectURL(blob);
                      this.sectionImage = this.editedSection.imageURL || '';
                      this.form.get('image')?.setValue('existing_photo');
                      this.beginningData = this.form.getRawValue();
                    }),
                    finalize(() => {
                      this.editedCategoryDataLoaded = true;
                      addModalStyle(this.renderer);

                      this.cdr.markForCheck();
                    }),
                    catchError(() => {
                      return EMPTY;
                    }),
                  );
              }
              loadImage$
                .pipe(
                  finalize(() => {
                    this.editedCategoryDataLoaded = true;
                    this.cdr.markForCheck();
                  }),
                )
                .subscribe();

          }
        )
      )
        .subscribe()


      
    }
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    if (!this.edit) {
      this.editedCategoryDataLoaded = true;
    }

    addModalStyle(this.renderer);
    this.initEditedSection();
  }

  onSectionImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file: File | undefined = input.files?.[0];

    if (file && checkFile(file)) {
      this.form.get('image')?.setValue(file);
      const objectURL = URL.createObjectURL(file);
      this.sectionImage = objectURL;
    }
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.sectionImage = this.defaultImage;
  }

  POSTSection(section: ISection) {
    const file: File = this.form.value.image;
    this.savedSection = section;

    this.sectionService
      .postSection(section)
      .pipe(
        catchError((response: any) => {
          if (response.error.info == 'NAME_EXISTS') {
            this.throwErrorModal(
              'Раздел с таким названием уже существует. Измените название и попробуйте снова.',
            );
          } else {
            this.throwErrorModal(
              'Произошла ошибка при попытке создать раздел.',
            );
          }
          return EMPTY;
        }),
        switchMap((response: any) => {
          const insertedId = response.id;
          this.savedSection.id = insertedId;
          if (file) {
            return this.sectionService.uploadSectionImage(file).pipe(
              switchMap((uploadResponse: any) => {
                const filename = uploadResponse.filename;
                return this.sectionService
                  .setImageToSection(insertedId, filename)
                  .pipe(
                    catchError(() => {
                      this.throwErrorModal(
                        'Произошла ошибка при попытке связать загруженное изображение и раздел.',
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
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.awaitModal = false;
          this.cdr.markForCheck();
        }),
        tap(() => {
          this.successModal = true;
        }),
      )
      .subscribe();
  }

  PUTSection(section: ISection) {
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

    const putCategory$ = this.sectionService.updateSection(section).pipe(
      catchError((response: any) => {
        if (response.error.info == 'NAME_EXISTS') {
          this.throwErrorModal(
            'Раздел с таким названием уже существует. Измените название и попробуйте снова.',
          );
        } else {
          this.throwErrorModal('Произошла ошибка при попытке обновить раздел.');
        }
        return EMPTY;
      }),
    );

    const loadImage$ = loadImage
      ? this.sectionService.uploadSectionImage(file).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке загрузить файл нового изображения раздела.',
            );
            return EMPTY;
          }),
          concatMap((response: any) => {
            const filename = response.filename;
            return this.sectionService
              .setImageToSection(section.id, filename)
              .pipe(
                catchError(() => {
                  this.throwErrorModal(
                    'Произошла ошибка при попытке связать новое загруженное изображение и раздел.',
                  );
                  return EMPTY;
                }),
              );
          }),
        )
      : of(null);

    const deleteImage$ = deleteImage ?
      this.sectionService.deleteImage(section.id).pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке удалить старое изображение раздела.',
          );
          return EMPTY;
        }),
        concatMap(() => {
          return this.sectionService.setImageToSection(section.id, '').pipe(
            catchError(() => {
              this.throwErrorModal(
                'Произошла ошибка при попытке удаления связи старого изображения с разделом.',
              );
              return EMPTY;
            }),
          );
        }),
      ) : of(null);

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
          this.savedSection = section;

          this.successModal = true;
        },
      });
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

  saveSection() {
    this.awaitModal = true;
    if (this.edit) {
      this.editSection();
    } else {
      this.createSection();
    }
  }

  private editSection() {
    const id = this.editedSection.id;
    const name = this.form.value.name;
    const updatedSection: ISection = {
      ...nullSection,
      id: id,
      name: name,
      image: this.getImageOfSavedSection(),
    };
    this.PUTSection(updatedSection);
  }

  private createSection() {
    const name = this.form.value.name;
    const createdSection: ISection = {
      ...nullSection,
      name: name,
    };
    this.POSTSection(createdSection);
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.saveSection();
    }
    this.saveModal = false;
    addModalStyle(this.renderer);
  }

  private throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }

  handleErrorModal() {
    this.errorModal = false;
    addModalStyle(this.renderer);
  }

  handleSuccessModal() {
    this.closeEmitter.emit(true);
    this.editEmitter.emit();
    this.successModal = false;

    if (this.currentUser.id) {
      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.WorkNotifies,
        )
      ) {
        let notify: INotification = nullNotification;
        if (this.edit) {
          notify = this.notifyService.buildNotification(
            'Раздел изменен',
            `Вы успешно изменили раздел категорий ${this.savedSection.name}`,
            'success',
            'category',
            `/sections/list/${this.savedSection.id}`,
          );
          
        } else {
           notify = this.notifyService.buildNotification(
             'Раздел создан',
             `Вы успешно создали новый раздел категорий «${this.savedSection.name}»`,
             'success',
             'category',
             `/sections/list/${this.savedSection.id}`,
           );
          
        }
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

  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
  }

  getImageOfSavedSection() {
    let image = '';
    const selectedImage = this.form.get('image')?.value;
    if (this.editedSection.image && selectedImage === 'existing_photo') {
      image = this.editedSection.image;
    } else {
      if (selectedImage) {
        image = 'image';
      }
    }
    return image;
  }
}
