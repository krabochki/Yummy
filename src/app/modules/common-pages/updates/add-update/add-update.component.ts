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
import { steps, Step, updateStatuses, context } from './const';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { getCurrentDate } from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { IUpdate, nullUpdate } from '../updates/const';
import { UpdatesService } from '../../services/updates.service';

@Component({
  selector: 'app-add-update',
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUpdateComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;
  @Output() closeEmitter = new EventEmitter<boolean>();

  tags: string[] = [];

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  newUpdate: IUpdate = { ...nullUpdate };
  categories: [] = [];

  updateStatuses = updateStatuses;
  context = context;

  currentStep: number = 0;
  allUsers: IUser[] = [];
  showInfo = false;
  steps: Step[] = steps;

  form: FormGroup;
  beginningData: any;
  maxId = 0;
  awaitModalShow = false;

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
    private authService: AuthService,
    private updateService: UpdatesService,
  ) {
    this.updateService.getMaxUpdateId().then((maxId) => {
      this.maxId = maxId;
    });
    this.userService.users$.subscribe(
      (receivedUsers: IUser[]) => (this.allUsers = receivedUsers),
    );
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.currentUser = receivedUser;
    });

    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          trimmedMinLengthValidator(4),
          Validators.maxLength(200),
        ],
      ],
      shortName: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          trimmedMinLengthValidator(4),
          Validators.maxLength(50),
        ],
      ],
      tag: ['', [Validators.maxLength(30)]],
      link: ['', [Validators.maxLength(1000)]],
      status: [null, [Validators.required]],
      context: [null, [Validators.required]],
      allowAccessOnlyForManagers: [false],
      global: [false],
      description: [null, [Validators.maxLength(1000)]],
    });
  }

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

  removeTag(tag: string) {
    const index = this.tags.findIndex((t) => t === tag);
    if (index !== -1) {
      this.tags.splice(index, 1);
    }
  }

  addTag() {
    if (this.form.get('tag')?.valid) {
      const tag = this.form.value.tag;
      this.tags.push(tag);
      this.form.get('tag')!.setValue('');
      this.cdr.markForCheck();
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
        return 'Исправьте все поля и попробуйте снова';
      case 1:
        return 'Исправьте все поля и попробуйте снова';
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
          if (
            !this.form.get('shortName')!.valid ||
            !this.form.get('name')!.valid ||
            !this.form.get('description')!.valid
          ) {
            return 1;
          }
          break;
        case 1:
          if (
            !this.form.get('context')!.valid ||
            !this.form.get('link')!.valid ||
            !this.form.get('status')!.valid
          ) {
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
  protected destroyed$: Subject<void> = new Subject<void>();

  currentUser: IUser = { ...nullUser };
  ngOnInit() {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    this.renderer.addClass(document.body, 'hide-overflow');
  }

  areObjectsEqual(): boolean {
    return this.form.get('name')!.value || this.form.get('status')!.value;
  }

  removeCategory() {
    this.form.get('status')!.setValue(null);
  }
  removeContext() {
    this.form.get('context')!.setValue(null);
  }
  //Работа с категориями
  addStatus(event: string) {
    this.form.get('status')!.setValue(event);
  }
  addContext(event: string) {
    this.form.get('context')!.setValue(event);
  }

  async addUpdateToSupabase() {
    const update: IUpdate = {
      showAuthor: this.form.get('global')?.value,
      id: this.maxId + 1,
      shortName: this.form.value.shortName || '',
      fullName: this.form.value.name || '',
      tags: this.tags || [],
      description: this.form.value.description || '',
      whoCanView:
        this.form.get('allowAccessOnlyForManagers')?.value === true
          ? 'managers'
          : 'all',
      context: this.form.value.context,
      link: this.form.value.link || '',
      author: this.currentUser.id,
      date: getCurrentDate(),
      state: this.form.value.status || '',
      status: this.currentUser.role === 'admin' ? 'public' : 'awaits',
    };
    this.newUpdate = update;
    this.awaitModalShow = true;
    this.cdr.markForCheck();
    const { error } = await this.updateService.addUpdateToSupabase(update);
    if (!error) {
      const updateNotification = this.notifyService.buildNotification(
        this.form.value.shortName,
        'Вышло новое обновление! Вы можете ознакомиться с ним на странице всех обновлений',
        'success',
        'update',
        '/updates',
      );
      if (update.status === 'public')
        await this.addNotificationToUsers(updateNotification);
      this.successModal = true;
    } else {
      console.log(error);
    }
    this.awaitModalShow = false;
    this.cdr.markForCheck();
  }

  handleSaveModal(answer: boolean) {
    this.saveModal = false;
    this.removeModalStyle();

    if (answer) {
      this.addUpdateToSupabase();
    }
  }
  handleSuccessModal() {
    this.closeEmitter.emit(true);
    this.successModal = false;

    if (this.userService.getPermission('you-create-update', this.currentUser)) {
      const admin = this.currentUser.role === 'admin';
      const notify: INotification = this.notifyService.buildNotification(
        !admin
          ? 'Обновление отправлено на проверку'
          : 'Обновление успешно опубликовано',
        `Созданное вами обновление «${this.newUpdate.shortName}»  ${
          !admin
            ? 'отправлено на проверку администратору'
            : 'успешно опубликовано на странице обновлений'
        }`,
        'success',
        'update',
        !admin ? '' : '/updates',
      );
      this.notifyService.sendNotification(notify, this.currentUser);
    }
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      this.removeModalStyle();
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

  removeModalStyle() {
    setTimeout(() => {
      this.renderer.addClass(document.body, 'hide-overflow');
      (<HTMLElement>document.querySelector('.header')).style.width =
        'calc(100% - 16px)';
    }, 0);
  }

  async addNotificationToUsers(newNotification: INotification) {
    await this.updateService.addNotificationToUsers(
      newNotification,
      this.allUsers,
      this.form.value.context,
    );
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }
}
