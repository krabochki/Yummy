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
import {
  ICategory,
  ISection,
  nullSection,
} from '../../../models/categories';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  tap,
} from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { CategoryService } from '../../../services/category.service';
import {
  addModalStyle,
  removeModalStyle,
} from 'src/tools/common';

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

  //modals
  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  loading: boolean = false;

  newSection: ISection = { ...nullSection };

  //image
  sectionImage: string = '';
  defaultImage: string = '/assets/images/add-section.png';

  //form
  form: FormGroup;
  beginningData: any;

  //initData
  @Input() editedSection: ISection = nullSection;
  categories: ICategory[] = [];
  categoriesNames: string[] = [];
  sections: ISection[] = [];

  editedCategoryDataLoaded = false;

  get edit() {
    return this.editedSection.id > 0;
  }

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private sectionService: SectionService,
    private categoryService: CategoryService,
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
      this.form.get('name')?.setValue(this.editedSection.name);

        let loadImage$: Observable<any> = EMPTY;
        if (this.editedSection.image) {
          loadImage$ = this.sectionService
            .downloadImage(this.editedSection.image)
            .pipe(
              tap((blob) => {
                this.editedSection.imageURL = URL.createObjectURL(blob);
                this.sectionImage = this.editedSection.imageURL || '';
                this.form.get('image')?.setValue('url');
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
  }

  ngOnInit() {
    if (!this.edit) {
      this.editedCategoryDataLoaded = true;
    }

    addModalStyle(this.renderer);
    this.initEditedSection();
  }

  onSectionImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.sectionImage = objectURL;
    }
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.sectionImage = this.defaultImage;
  }

  createSection() {
    this.loading = true;
    this.cdr.markForCheck();

    let loadImage = false;
    let deleteImage = false;
    if (this.edit) {
      if (this.editedSection.image !== this.newSection.image) {
        if (this.newSection.image) {
          loadImage = true;
        }
        if (this.editedSection.image) {
          deleteImage = true;
        }
      }

      let loadImage$: Observable<any> = of(null);

      try {
        loadImage$ = loadImage
          ? this.sectionService
              .uploadSectionImage(this.form.get('image')?.value)
              .pipe(
                map((response: any) => {
                  const filename = response.filename;
                  this.newSection.image = filename;
                }),
              )
          : of(null);
      } catch {
        this.error = 'Произошла ошибка при попытке загрузки картинки категории';
        this.errorModal = true;
        this.loading = false;
        this.cdr.markForCheck();
      }

      const deleteImage$ =
        deleteImage && this.editedSection.image
          ? this.sectionService.deleteImage(this.editedSection.image)
          : of(null);
      const putSection$ = this.sectionService.updateSection(this.newSection);

      forkJoin([loadImage$, deleteImage$])
        .pipe(
          map(() => {
            putSection$
              .pipe(
                tap(() => {
                  
                  
                  this.successModal = true;
                  this.cdr.markForCheck();

                }),

                catchError((response) => {
                  if (loadImage && this.newSection.image) {
                    this.sectionService
                      .deleteImage(this.newSection.image)
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
                  this.loading = false;
                  this.cdr.markForCheck();
                }),
              )
              .subscribe();
          }),
        )
        .subscribe();
    } else {
      if (this.form.get('image')?.value) {
        this.sectionService
          .uploadSectionImage(this.form.get('image')?.value)
          .subscribe((res: any) => {
            const filename = res.filename;
            this.newSection.image = filename;
            this.postSection();
          });
      } else {
        this.postSection();
      }
    }
  }

  postSection() {
    this.sectionService
      .postSection(this.newSection)
      .pipe(
        tap((response: any) => {
          const section: ISection = {
            ...this.newSection,
            id: response.id,
          };

          if (section.image) {
            this.sectionService.downloadImage(section.image).subscribe({
              next: (blob) => {
                section.imageURL = URL.createObjectURL(blob);
              },
              error: () => {
                section.imageURL = '';
              },
              complete: () => {
              },
            });
          } 
          this.successModal = true;
          this.cdr.markForCheck();
        }),

        catchError((response) => {
          if (this.newSection.image) {
            this.sectionService
              .deleteImage(this.newSection.image)
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
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe();
  }

  error = '';
  errorModal = false;
  closeEditModal() {
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
      this.closeEditModal()
    

  }

  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  handleSaveModal(answer: boolean) {
    let image = '';
    if (this.editedSection.image && this.form.get('image')?.value === 'url') {
      image = this.editedSection.image;
    } else {
      if (this.form.get('image')?.value) {
        image = 'image';
      }
    }
    this.newSection = {
      ...nullSection,
      image: image,
      name: this.form.value.name,
      id: this.edit ? this.editedSection.id : 0,
    };
    if (answer) {
      this.createSection();
    }
    addModalStyle(this.renderer);
    this.saveModal = false;
  }
  handleSuccessModal() {
    this.closeEmitter.emit(true);
    this.editEmitter.emit();
    this.successModal = false;
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
}
