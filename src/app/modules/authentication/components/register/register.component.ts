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
import { Subscription } from 'rxjs';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit, OnDestroy {
  emailMask = loginMask; //маска для почты
  passMask = passMask; //маска для пароля
  usernameMask = usernameMask;
  email: string = '';
  pass: string = '';
  username: string = '';
  modalAreYouSureShow: boolean = false;
  modalSuccessShow: boolean = false;
  modalFailShow: boolean = false;
  failText: string = '';
  users: IUser[] = [];
  usersSubscription?: Subscription;

  get testUserData() {
    return (
      this.emailMask.test(this.email) &&
      this.usernameMask.test(this.username) &&
      this.passMask.test(this.pass)
    );
  }

  form: FormGroup;

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private titleService: Title,
    private router: Router,
    private usersService: UserService,
    private fb: FormBuilder,
  ) {
    this.titleService.setTitle('Регистрация');

    this.form = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(100),
          this.customPatternValidator(this.emailMask),
        ],
      ],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          this.customPatternValidator(this.usernameMask),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          this.customPatternValidator(this.passMask),
        ],
      ],
    });
  }

  ngOnInit() {
    this.usersSubscription = this.usersService.users$.subscribe(
      (users: IUser[]) => {
        this.users = users;
      },
    );
  }

  //Валидатор по маске regex для формы
  customPatternValidator(pattern: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isValid = pattern.test(control.value);
      return isValid ? null : { customPattern: { value: control.value } };
    };
  }

  registration() {
    if (this.form.valid) {
      const maxId = Math.max(...this.users.map((u) => u.id));
      const userData: IUser = {
        ...nullUser,
        username: this.form.value.username,
        email: this.form.value.email,
        password: this.form.value.password,
        id: maxId + 1,
      };

      const emailExists = this.authService.isEmailExist(
        this.users,
        userData.email,
      );
      const usernameExists = this.authService.isUsernameExist(
        this.users,
        userData.username,
      );

      if (!emailExists && !usernameExists) {
        this.usersService.postUser(userData).subscribe(
          () => {
            this.authService.loginUser(userData).subscribe(() => {
              localStorage.setItem('currentUser', JSON.stringify(userData));
              this.authService.setCurrentUser(userData);
              this.modalSuccessShow = true;
              this.cd.markForCheck();
              (error: Error) => {
                console.error(
                  'Регистрация | Ошибка в AuthService (loginUser): ' + error.message,
                );
              };
            });
          },
          (error: Error) => {
            console.error(
              'Регистрация | Ошибка в UserService (postUser): ' + error.message,
            );
          },
        );
      } else {
        if (emailExists) {
          this.failText =
            'Регистрация невозможна, так как пользователь с данной электронной почтой уже существует.';
        }
        if (usernameExists) {
          this.failText =
            'Регистрация невозможна, так как пользователь с данным именем пользователя уже существует.';
        }
        if (usernameExists && emailExists) {
          this.failText =
            'Регистрация невозможна, так как пользователь с данной электронной почтой и именем пользователя уже существует.';
        }
        this.modalFailShow = true;
      }
    }
  }

  handleAreYouSureModalResult(result: boolean) {
    if (result) {
      this.registration();
    }
    this.modalAreYouSureShow = false;
  }
  handleSuccessModalResult() {
    this.router.navigate(['/']);
    this.modalSuccessShow = false;
  }
  handleFailModalResult() {
    this.modalFailShow = false;
  }

  ngOnDestroy() {
    this.usersSubscription?.unsubscribe();
  }
}
