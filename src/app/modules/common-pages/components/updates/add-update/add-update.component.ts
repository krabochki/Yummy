import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
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

import { Observable, Subject, finalize, forkJoin, tap } from 'rxjs';
import { addModalStyle, getCurrentDate, removeModalStyle } from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { IUpdate, nullUpdate } from '../updates/const';
import { UpdatesService } from '../../../services/updates.service';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

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
  @Output() createEmitter = new EventEmitter();

  tags: string[] = [];

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  newUpdate: IUpdate = { ...nullUpdate };
  categories: [] = [];

  updateStatuses = updateStatuses;
  context = context;

  currentStep: number = 0;
  showInfo = false;
  steps: Step[] = steps;

  form: FormGroup;
  beginningData: any;
  awaitModalShow = false;

  viewedSteps: number[] = [];

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

  constructor(
    private notifyService: NotificationService,
    private renderer: Renderer2,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private authService: AuthService,
    private updateService: UpdatesService,
  ) {
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
      this.form.get('tag')?.setValue('');
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
    addModalStyle(this.renderer);
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

  get showContext() {
    switch (this.form.get('context')?.value) {
      case 'all':
        return 'Уведомить всех кулинаров';
      case 'managers':
        return 'Уведомить модераторов и администратора';
      case 'nobody':
        return 'Никого не уведомлять';
    }
    return '';
  }

  addContext(event: string) {
    switch (event) {
      case 'Уведомить всех кулинаров':
        this.form.get('context')!.setValue('all');
        break;
      case 'Уведомить модераторов и администратора':
        this.form.get('context')!.setValue('managers');
        break;
      case 'Никого не уведомлять':
        this.form.get('context')?.setValue('nobody');
        break;
    }
  }

  postUpdate() {
    const update: IUpdate = {
      id: 0,
      open: false,
      shortName: this.form.value.shortName || '',
      fullName: this.form.value.name || '',
      tags: this.tags || [],
      description: this.form.value.description || '',
      context: this.form.get('allowAccessOnlyForManagers')?.value
        ? 'managers'
        : 'all',
      link: this.form.value.link || '',
      authorId: this.currentUser.id,
      sendDate: getCurrentDate(),
      notify: this.form.value.context,
      state: this.form.value.status || '',
      status: this.currentUser.role === 'admin' ? 'public' : 'awaits',
    };
    this.newUpdate = update;
    this.awaitModalShow = true;
    this.cdr.markForCheck();
    this.updateService
      .postUpdate(update)
      .pipe(
        tap((response: any) => {
          update.id = response.id;
          this.successModal = true;

          this.sendNotifyForUpdateAuthor();
          if (update.status === 'public') {
            this.updateUpdates = true;
            this.sendNotificationAboutUpdate(update);
          }
        }),
        finalize(() => {
          this.awaitModalShow = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe();
  }

  handleSaveModal(answer: boolean) {
    this.saveModal = false;
    addModalStyle(this.renderer);

    if (answer) {
      this.postUpdate();
    }
  }

  updateUpdates = false;

  sendNotificationAboutUpdate(update: IUpdate) {
    if (update.notify !== 'nobody') {
      const updateNotification = this.notifyService.buildNotification(
        update.shortName,
        'А у нас новости! Вы можете ознакомиться с нововведениями, нажав на уведомление.',
        'success',
        'update',
        '/news',
      );

      let getUsers$: Observable<any> = this.userService.getAllShort();
      if (update.notify === 'managers') {
        getUsers$ = this.userService.getManagersShort();
      }
      getUsers$
        .pipe(
          tap((users: IUser[]) => {
            if (users.length) {
              const sendNotifications$: Observable<any>[] = [];
              users.map((u) => {
                const forMe = u.id === this.currentUser.id;
                const sendNotification$ = this.notifyService.sendNotification(
                  updateNotification,
                  u.id,
                  forMe ? true : false,
                );
                sendNotifications$.push(sendNotification$);
              });
              forkJoin(sendNotifications$).subscribe();
            }
          }),
        )
        .subscribe();
    }
  }

  sendNotifyForUpdateAuthor() {
    const permission = this.userService.getPermission(
      this.currentUser.limitations || [],
      this.currentUser.role === 'admin'
        ? Permission.NewsCreated
        : Permission.NewsSent,
    );
    //  this.userService.getPermission('you-create-update', this.currentUser)
    const admin = this.currentUser.role === 'admin';
    if (permission) {
      const notify: INotification = this.notifyService.buildNotification(
        !admin
          ? 'Новость отправлена на проверку'
          : 'Новость успешно опубликована',
        `Созданная вами новость «${this.newUpdate.shortName}»  ${
          !admin
            ? 'отправлена на проверку администратору'
            : 'успешно опубликована на странице новостей'
        }`,
        'success',
        'update',
        !admin ? '' : '/news',
      );
      this.notifyService
        .sendNotification(notify, this.currentUser.id, true)

        .subscribe();
    }
  }

  handleSuccessModal() {
    this.closeEmitter.emit(true);
    if (this.updateUpdates) {
      this.createEmitter.emit();
    }
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
    removeModalStyle(this.renderer);
  }
}
