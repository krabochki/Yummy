import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
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

import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICategory, ISection, nullCategory } from '../../../models/categories';
import { SectionGroup } from 'src/app/modules/controls/autocomplete/autocomplete.component';
import { Subject, takeUntil } from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { getCurrentDate } from 'src/tools/common';
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
  styleUrls: ['./category-creating.component.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCreatingComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  @Output() closeEmitter = new EventEmitter<boolean>();

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  newCategory: ICategory = { ...nullCategory };
  categories: ICategory[] = [];

  myImage: string = '';
  defaultImage: string = '../../../../../assets/images/add-category.png';
  form: FormGroup;
  beginningData: any;
  maxId = 0;

  viewedSteps: number[] = [];

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
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
    this.myImage = this.defaultImage;
  }

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  currentStep: number = 0;

  showInfo = false;

  steps: Step[] = steps;

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.scrollTop();
    }
  }

  addViewedStep(i: number) {
    if (!this.viewedSteps.includes(i)) {
      this.viewedSteps.push(i);
    }
  }

  notValid() {
    return this.validNextSteps();
  }
  clickOnCircleStep(i: number) {
    if (this.validNextSteps() === 0 || this.validNextSteps() > i) {
      this.currentStep = i;
      this.addViewedStep(this.currentStep);

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
      this.addViewedStep(this.currentStep);

      this.scrollTop();
    }
  }
  allSections: ISection[] = [];
  allCategories: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  currentUser: IUser = { ...nullUser };
  ngOnInit() {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    this.renderer.addClass(document.body, 'hide-overflow');
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ICategory[]) => {
        this.allCategories = data;

        this.sectionService.sections$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((data: ISection[]) => {
            this.allSections = data;
          });
      });
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
      });
  }

  onUserpicChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.myImage = objectURL;
      this.supabaseFilepath = this.setUserpicFilenameForSupabase();
    }
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.myImage = this.defaultImage;
    this.supabaseFilepath = '';
  }

  areObjectsEqual(): boolean {
    return this.form.get('name')!.value || this.form.get('section')!.value;
  }

  removeCategory() {
    this.form.get('section')!.setValue(null);
  }

  //Работа с категориями
  addCategory(event: ISection) {
    this.form.get('section')!.setValue(event);
  }

  group: SectionGroup[] = [];

  fullGroup: SectionGroup[] = [];

  createCategory() {
    this.newCategory = {
      name: this.form.value.name,
      photo: this.form.value.image ? this.supabaseFilepath : undefined,
      sendDate: getCurrentDate(),
      authorId: this.currentUser.id,
      id: this.maxId + 1,
      status: this.currentUser.role === 'user' ? 'awaits' : 'public',
    };

    if (this.form.value.image) {
      this.loadCategorypicToSupabase(this.newCategory);
    } else {
      this.addCategoryToSupabase(this.newCategory);
    }

    if (this.form.get('section')!.value) {
      this.form.get('section')!.value.categories.push(this.newCategory.id);
      this.sectionService.updateSectionInSupabase(
        this.form.get('section')!.value,
      );
    }
  }

  async addCategoryToSupabase(category: ICategory) {
    this.awaitModalShow = true;
    this.cdr.markForCheck();
    await this.categoryService.addCategoryToSupabase(category);
    this.awaitModalShow = false;
    this.successModal = true;
    this.cdr.markForCheck();
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.createCategory();
    }
    setTimeout(() => {
      this.renderer.addClass(document.body, 'hide-overflow');
      (<HTMLElement>document.querySelector('.header')).style.width =
        'calc(100% - 16px)';
    }, 0);
    this.saveModal = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleSuccessModal(answer: boolean) {
    this.closeEmitter.emit(true);
    this.successModal = false;

    if (
      this.userService.getPermission('you-create-category', this.currentUser) &&
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
      this.notifyService.sendNotification(notify, this.currentUser);
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
    this.areObjectsEqual() || this.form.get('image')?.value
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  supabaseFilepath = '';
  awaitModalShow = false;

  private setUserpicFilenameForSupabase(): string {
    const file = this.form.get('image')?.value;
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}.${fileExt}`;
  }

  async loadCategorypicToSupabase(category: ICategory) {
    this.awaitModalShow = true;
    try {
      const file = this.form.get('image')?.value;
      const filePath = this.supabaseFilepath;
      await supabase.storage.from('categories').upload(filePath, file);
      await this.categoryService.addCategoryToSupabase(category);
      this.successModal = true;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      this.awaitModalShow = false;

      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }
}
