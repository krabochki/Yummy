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
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  successAttemptModalShow: boolean = false;
  unsuccessfusAttemptModalShow: boolean = false;
  unsuccessfusAttemptModalText: string = '';
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

    this.form = this.fb.group({
      login: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(64),
          this.customPatternValidator(emailOrUsernameMask),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          this.customPatternValidator(passMask),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.usersService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers: IUser[]) => {
        this.users = receivedUsers;
      });
  }

  //Валидатор по маске regex для формы
  customPatternValidator(pattern: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isValid = pattern.test(control.value);
      return isValid ? null : { customPattern: { value: control.value } };
    };
  }

  loginUser(): void {
    if (this.form.valid) {
      const userData: IUser = {
        ...nullUser,
        username: this.form.value.login,
        email: this.form.value.login,
        password: this.form.value.password,
      };

      this.authService
        .loginUser(userData)
        .pipe(takeUntil(this.destroyed$))
        .subscribe((user: IUser | null) => {
          if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.authService.setCurrentUser(user);
            this.successAttemptModalShow = true;

            this.cd.markForCheck();
          } else {
            const user = this.users.find(
              (user) =>
                user.email === userData.email ||
                user.username === userData.username,
            );
            if (user !== undefined) {
              this.unsuccessfusAttemptModalText =
                'Неправильный пароль. Попробуйте ввести данные снова или восстановить пароль';
            } else {
              this.unsuccessfusAttemptModalText =
                'Пользователя с такими данными не существует. Попробуйте перепроверить данные или зарегистрируйтесь';
            }
            this.unsuccessfusAttemptModalShow = true;
          }
        });
    }
  }

  handleErrorModalResult(): void {
    this.unsuccessfusAttemptModalShow = false;
  }
  handleSuccessModalResult(): void {
    this.successAttemptModalShow = false;
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
