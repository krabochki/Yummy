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
import { Subject, takeUntil } from 'rxjs';
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
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { trimmedMinLengthValidator } from 'src/tools/validators';

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
  @Input() editedCategory: ICategory = nullCategory;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  //modals
  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  awaitModalShow = false;

  private newCategory: ICategory = { ...nullCategory };
  private maxId = 0;

  //init data
  sections: ISection[] = [];
  group: SectionGroup[] = [];
  categories: ICategory[] = [];
  currentUser: IUser = { ...nullUser };
  startSection: ISection = nullSection;

  //images
  categoryImage: string = '';
  defaultImage: string = '/assets/images/add-category.png';

  //form
  form: FormGroup;
  beginningData: any;

  supabaseFilepath = '';

  currentStep: number = 0;
  steps: Step[] = steps;

  showInfo = false;

  protected destroyed$: Subject<void> = new Subject<void>();

  get editMode() {
    return this.editedCategory.id > 0;
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
    this.categoryService.getMaxCategoryId().then((maxId) => {
      this.maxId = maxId;
    });
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
    this.categoriesInit();
    this.currentUserInit();
  }

  private categoriesInit() {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ICategory[]) => {
        this.categories = data.filter((c) => c.status === 'public');
        this.sectionsInit();
      });
  }

  private editedCategoryInit() {
    if (this.editMode) {
      const categorySection = this.sections.find((s) =>
        s.categories.includes(this.editedCategory.id),
      );

      if (this.editedCategory.photo) {
        this.downloadCategoryImageFromSupabase(this.editedCategory.photo);
        this.supabaseFilepath = this.editedCategory.photo;
        this.form.get('image')?.setValue('url');
      }
      this.form.get('name')?.setValue(this.editedCategory.name);
      this.form.get('section')?.setValue(categorySection);
      this.startSection = categorySection || nullSection;
    }
    this.beginningData = this.form.getRawValue();
  }
  private sectionsInit() {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ISection[]) => {
        this.sections = data;
        this.editedCategoryInit();
      });
  }

  private currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
      });
  }

  private downloadCategoryImageFromSupabase(path: string) {
    this.categoryImage = supabase.storage
      .from('categories')
      .getPublicUrl(path).data.publicUrl;
  }

  //images
  onCategoryImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.categoryImage = objectURL;
      this.supabaseFilepath = this.setCategoryImageFilenameForSupabase();
    }
  }
  unsetCategoryImage(): void {
    this.form.get('image')?.setValue(null);
    this.categoryImage = this.defaultImage;
    this.supabaseFilepath = '';
  }
  private setCategoryImageFilenameForSupabase(): string {
    const file = this.form.get('image')?.value;
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}.${fileExt}`;
  }

  //section
  clearSection(): void {
    this.form.get('section')?.setValue(null);
  }
  selectSection(selectedSection: ISection): void {
    this.form.get('section')?.setValue(selectedSection);
  }

  async createCategory() {
    this.newCategory = {
      name: this.form.value.name,
      photo: this.form.value.image ? this.supabaseFilepath : '',
      sendDate: getCurrentDate(),
      authorId: this.editMode
        ? this.editedCategory.authorId
        : this.currentUser.id,
      id: this.editedCategory.id > 0 ? this.editedCategory.id : this.maxId + 1,
      status: this.editMode
        ? 'public'
        : this.currentUser.role === 'user'
          ? 'awaits'
          : 'public',
    };

    await this.addCategoryToSupabase(this.newCategory);
  }

  async loadCategoryImageToSupabase() {
    const file = this.form.get('image')?.value;
    const filePath = this.supabaseFilepath;
    await this.categoryService.loadCategoryImageToSupabase(filePath, file);
  }

  async addCategoryToSupabase(category: ICategory) {
    this.awaitModalShow = true;
    this.cdr.markForCheck();
    const section: ISection = this.form.get('section')?.value;

    if (this.editMode) {
      if (this.editedCategory.photo === null) {
        this.editedCategory.photo = '';
      }
      if (this.editedCategory.photo !== this.newCategory.photo) {
        if (this.newCategory.photo) {
          await this.loadCategoryImageToSupabase();
        }
        if (this.editedCategory.photo) {
          await this.categoryService.removeCategoryImageFromSupabase(
            this.editedCategory.photo,
          );
        }
      }
      if (section.id !== this.startSection.id) {
        this.startSection = {
          ...this.startSection,
          categories: this.startSection.categories.filter(
            (c) => c !== category.id,
          ),
        };

        await this.sectionService.updateSectionInSupabase(this.startSection);
      }
      await this.categoryService.updateCategoryInSupabase(category);
    } else {
      await this.categoryService.addCategoryToSupabase(category);
      if (this.form.value.image) {
        await this.loadCategoryImageToSupabase();
      }
    }

    if (section) {
      if (!this.editMode || section.id !== this.startSection.id) {
        section.categories.push(this.newCategory.id);
        await this.sectionService.updateSectionInSupabase(section);
      }
    }

    this.awaitModalShow = false;
    if (!this.editMode) {
      this.successModal = true;
    } else {
      this.editEmitter.emit();
      this.closeEmitter.emit(true);
    }
    this.cdr.markForCheck();
  }

  //modals
  handleSaveModal(answer: boolean) {
    if (answer) {
      this.createCategory();
    }
    addModalStyle(this.renderer);
    this.saveModal = false;
  }
  async handleSuccessModal() {
    this.closeEmitter.emit(true);
    this.successModal = false;
    if (this.editedCategory.id === 0) {
      if (
        this.userService.getPermission(
          'you-create-category',
          this.currentUser,
        ) &&
        this.form.get('section')!.value
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          this.currentUser.role === 'user'
            ? 'Категория отправлена на проверку'
            : 'Категория опубликована',
          `Созданная вами категория «${this.newCategory.name}» для секции «${
            this.form.get('section')!.value.name
          }» ${
            this.currentUser.role === 'user'
              ? 'отправлена на проверку'
              : 'успешно опубликована'
          }`,
          'success',
          'category',
          this.currentUser.role === 'user'
            ? ''
            : '/categories/list/' + this.newCategory.id,
        );
        await this.notifyService.sendNotification(notify, this.currentUser);
      }
    }
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      setTimeout(() => {
        this.renderer.addClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          'calc(100% - 16px)';
      }, 0);
    }
    this.closeModal = false;
  }

  closeEditModal() {
    this.areObjectsEqual() || this.form.get('image')?.value
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
