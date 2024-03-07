/* eslint-disable @typescript-eslint/no-explicit-any */
import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { loginMask, passMask, usernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { modal } from 'src/tools/animations';
import { customPatternValidator, policyValidator } from 'src/tools/validators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, finalize, takeUntil, tap } from 'rxjs';
import { getCurrentDate } from 'src/tools/common';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit, OnDestroy {
  form: FormGroup;
  failText = '';
  confirmModal: boolean = false;
  successModal: boolean = false;
  loadingModal: boolean = false;
  errorModal: boolean = false;

  private users: IUser[] = [];

  destroyed$: Subject<void> = new Subject<void>();

  get passwordNotValidError(): string {
    return this.form.get('password')?.invalid &&
      (this.form.get('password')?.dirty || this.form.get('password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква английского алфавита'
      : '';
  }
  get emailNotValidError(): string {
    return !this.form.get('email')?.hasError('emailExists')
      ? this.form.get('email')?.invalid &&
        (this.form.get('email')?.dirty || this.form.get('email')?.touched)
        ? 'Введи корректный адрес электронной почты'
        : ''
      : ' ';
  }
  get usernameNotValidError(): string {
    return !this.form.get('username')?.hasError('usernameExists')
      ? this.form.get('username')?.invalid &&
        (this.form.get('username')?.dirty || this.form.get('username')?.touched)
        ? 'Имя пользователя должно содержать от 4 до 20 символов, среди которых могут быть буквы английского алфавита (минимум одна), цифры, а также нижние почеркивания и точки (не подряд)'
        : ''
      : ' ';
  }

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private notifyService:NotificationService,
    private titleService: Title,
    private router: Router,
    private usersService: UserService,
    private fb: FormBuilder,
  ) {
    this.titleService.setTitle('Регистрация');
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.usersInit();

    this.form = this.fb.group({
      policy: [false, [policyValidator]],
      email: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(64),
          customPatternValidator(loginMask),
        ],
      ],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          customPatternValidator(usernameMask),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          customPatternValidator(passMask),
        ],
      ],
    });
  }

   registration() {
    if (this.form.valid) {
      this.loadingModal = true;
      this.cd.markForCheck();

      const newUser: IUser = {
        ...nullUser,
        username: this.form.value.username.toLowerCase(),
        email: this.form.value.email,
        password: this.form.value.password,
        registrationDate: getCurrentDate(),
      };

      this.authService
        .postUser(newUser)
        .pipe(
          tap((res) => {
            this.successModal = true;
            this.sendNotifyToBornedUser(newUser.username, res.id);
            
          }),
          catchError((e) => {
            this.failText = e.error.content || 'Произошла неизвестная ошибка';
            this.errorModal = true;
            return EMPTY;
          }),
          finalize(() => {
            this.loadingModal = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  handleConfirmModal(result: boolean): void {
    if (result) {
      this.registration();
    }
    this.confirmModal = false;
  }
  handleSuccessModal() {
    this.successModal = false;
    this.router.navigate(['/']);
  }


  sendNotifyToBornedUser(username:string, userId:number) {
    const notify = this.notifyService.buildNotification(
      'Добро пожаловать',
      `Добро пожаловать в Yummy, @${username} 🍾! Надеемся, вам понравятся возможности нашей социальной сети. Теперь вы имеете доступ ко всем функциям зарегистрированных кулинаров. Удачи!`,
      'success',
      'born',
      '',
    );
    this.notifyService.sendNotification(notify, userId).subscribe();
  }



  private usersInit(): void {
    this.usersService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers: IUser[]) => {
        this.users = receivedUsers;
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
