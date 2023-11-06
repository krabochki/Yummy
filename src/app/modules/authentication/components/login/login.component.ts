/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  passMask,
  emailOrUsernameMask
} from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { customPatternValidator, usernameAndEmailNotExistsValidator } from 'src/tools/validators';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  successAttemptModalShow: boolean = false;
  failAttemptModalShow: boolean = false;
  users: IUser[] = [];
  form: FormGroup;
  protected destroyed$: Subject<void> = new Subject<void>();

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
    this.usersService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers: IUser[]) => {
        this.users = receivedUsers;
      });

    this.form = this.fb.group({
      login: [
        '',
        [
          Validators.required,
          Validators.maxLength(64),
          customPatternValidator(emailOrUsernameMask),
          usernameAndEmailNotExistsValidator(this.users),
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

  loginUser(): void {
    if (this.form.valid) {
      const userData: IUser = {
        ...{...nullUser},
        username: this.form.value.login,
        email: this.form.value.login,
        password: this.form.value.password,
      };

      this.authService.loginUser(userData).subscribe((user: IUser | null) => {
        if (user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.authService.setCurrentUser(user);
          this.successAttemptModalShow = true;
          this.cd.markForCheck();
        }
        else {
          this.failAttemptModalShow = true;
        }
      });
    }
  }

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
        ? 'Введи корректный логин или электронную почту'
        : ''
      : '';
  }

  handleSuccessModalResult(): void {
    this.successAttemptModalShow = false;
    this.router.navigate(['/']);
  }

  handleFailModalResult(): void {
    this.failAttemptModalShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
