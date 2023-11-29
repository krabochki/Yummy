/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { passMask, loginMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  customPatternValidator,
} from 'src/tools/validators';
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
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква'
      : '';
  }

  get loginNotValidError() {
    return !this.form.get('login')?.hasError('loginExists')
      ? this.form.get('login')?.invalid &&
        (this.form.get('login')?.dirty || this.form.get('login')?.touched)
        ? 'Введите корректный адрес электронной почты'
        : ''
      : ' ';
  }

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private usersService: UserService,
    private router: Router,
  ) {
    this.titleService.setTitle('Вход');

    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.usersInit();

    this.form = this.fb.group({
      login: [
        '',
        [
          Validators.required,
          Validators.maxLength(64),
          customPatternValidator(loginMask),
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

  async loginUser() {
    if (this.form.valid) {
      const user: IUser = {
        ...nullUser,
        username: this.form.value.login,
        email: this.form.value.login,
        password: this.form.value.password,
      };
      try {
        this.loadingModal = true;
        const { error } = await this.authService.signIn(
          user.email,
          user.password,
        );

        if (error) {
          switch (error.message) {
            case 'Email not confirmed':
              this.failInfo =
                'Вы пока не подтвердили аккаунт после регистрации. Проверьте письмо в вашей электронной почте';
              break;
            case 'Invalid login credentials':
              this.failInfo =
                'Скорее всего, вы где-то ошиблись. Такого пользователя не найдено. Перепроверьте данные и попробуйте снова';
              break;
            default:
              this.failInfo =
                'Произошла неизвестная ошибка при регистрации. Попробуйте снова';
          }

          this.errorModal = true;
        } else {
          const loginUser = this.authService.loginUser(user);
            if (loginUser) {
              this.authService.setCurrentUser(loginUser);
              this.router.navigateByUrl('/');
            } else {
              this.errorModal = true;
            }
        }
      } catch (error) {
        if (error instanceof Error) {
          this.errorModal = true;
        }
      } finally {
        this.loadingModal = false;
        this.cd.markForCheck();
      }
    }
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
