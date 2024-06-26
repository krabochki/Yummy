/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { passMask, emailOrUsernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, finalize, tap } from 'rxjs';
import { customPatternValidator } from 'src/tools/validators';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  successModal: boolean = false;
  loadingModal: boolean = false;
  errorModal: boolean = false;
  failInfo = '';
  form: FormGroup;
  destroyed$: Subject<void> = new Subject<void>();
  private users: IUser[] = [];

  get passwordNotValidError() {
    return this.form.get('password')?.invalid &&
      (this.form.get('password')?.dirty || this.form.get('password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква английского алфавита'
      : '';
  }

  get loginNotValidError() {
    return !this.form.get('login')?.hasError('loginExists')
      ? this.form.get('login')?.invalid &&
        (this.form.get('login')?.dirty || this.form.get('login')?.touched)
        ? 'Введите корректную электронную почту или имя пользователя'
        : ''
      : ' ';
  }

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private router: Router,
  ) {
    this.titleService.setTitle('Вход');

    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      login: [
        '',
        [
          Validators.required,
          Validators.maxLength(64),
          customPatternValidator(emailOrUsernameMask),
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
  user: IUser = { ...nullUser };

  loginUser() {
    if (this.form.valid) {
      const loginUser: IUser = {
        ...nullUser,
        username: this.form.value.login,
        password: this.form.value.password,
      };

      this.loadingModal = true;

      this.authService
        .loginUser(loginUser)
        .pipe(
          tap(() => {
            this.authService
              .getTokenUser()
              .pipe(
                tap((user:IUser) => {
                  
                  this.user = user;
                      this.successModal = true;
                      this.cd.markForCheck();
                    
                  
                }),
                catchError((e) => {
                  this.failInfo =
                    e.error.content || 'Произошла неизвестная ошибка';
                  this.errorModal = true;
                  return EMPTY;
                }),
                finalize(() => {
                  this.loadingModal = false;
                  this.cd.markForCheck();
                }),
              )
              .subscribe();
          }),
          catchError((e) => {
            this.failInfo = e.error.content || 'Произошла неизвестная ошибка';
            this.errorModal = true;
                        this.loadingModal = false;
                        this.cd.markForCheck();

            return EMPTY;
          })
        )
        .subscribe();
    }
  }

  handleSuccessModal() {
this.authService.setCurrentUser(this.user)
this.router.navigateByUrl('/');
    
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
