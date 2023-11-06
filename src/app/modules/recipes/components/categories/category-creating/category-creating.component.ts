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

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICategory, ISection, nullCategory } from '../../../models/categories';
import { SectionGroup } from 'src/app/modules/controls/autocomplete/autocomplete.component';
import { Subject, takeUntil } from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { getCurrentDate } from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';

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
  selectedSection: ISection | null = null;

  myImage: string = '';
  defaultImage: string = '../../../../../assets/images/add-category.png';
  form: FormGroup;
  beginningData: any;

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  constructor(
    private notifyService: NotificationService,
    private renderer: Renderer2,
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
          Validators.maxLength(30),
        ],
      ],
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
  scrollTop(): void {
    if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
  }
  goToNextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.scrollTop();
    }
  }
  allSections: ISection[] = [];
  allCategories: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  currentUser: IUser = {...nullUser};
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
    }
  }

  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  removeCategory(event: ISection) {
    this.selectedSection = null;
  }

  //Работа с категориями
  addCategory(event: ISection) {
    this.selectedSection = event;
  }

  group: SectionGroup[] = [];

  fullGroup: SectionGroup[] = [];

  createCategory() {
    const userpicData = new FormData();
    userpicData.append('image', this.form.get('image')?.value);
    const maxId = Math.max(...this.allCategories.map((u) => u.id));
    this.newCategory = {
      name: this.form.value.name,
      photo: userpicData,
      sendDate: getCurrentDate(),
      authorId: this.currentUser.id,
      id: maxId + 1,
      status: 'awaits',
    };

    this.categoryService.postCategory(this.newCategory).subscribe(() => {
      this.successModal = true;
      if (this.selectedSection) {
        this.selectedSection.categories.push(this.newCategory.id);
        this.sectionService.updateSections(this.selectedSection).subscribe();

        const author: IUser = this.currentUser;
        const title =
          'Категория «' +
          this.newCategory.name +
          '» для секции «' +
          this.selectedSection.name +
          '» отправлена на проверку';

        const notify: INotification = this.notifyService.buildNotification(
          'Категория отправлена на проверку',
          title,
          'success',
          'category',
          '',
        );
        this.notifyService.sendNotification(notify, author).subscribe();
      }
    });
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.createCategory();
      this.successModal = true;
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
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }
  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }
}
