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
import {
  customPatternValidator,
  emailExistsValidator,
} from 'src/tools/validators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { usernameExistsValidator } from 'src/tools/validators';
import { getCurrentDate } from 'src/tools/common';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
import { IPlan, nullPlan } from 'src/app/modules/planning/models/plan';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit, OnDestroy {
  modalAreYouSureShow: boolean = false;
  modalSuccessShow: boolean = false;
  users: IUser[] = [];
  form: FormGroup;
  protected destroyed$: Subject<void> = new Subject<void>();
  private plans: IPlan[] = [];

  createUser: IUser = { ...nullUser };

  usernameValidator = usernameExistsValidator;

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private titleService: Title,
    private router: Router,
    private usersService: UserService,
    private fb: FormBuilder,
    private planService: PlanService,
  ) {
    this.titleService.setTitle('Регистрация');
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.planService.plans$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedPlans: IPlan[]) => {
        this.plans = receivedPlans;
      });
    this.usersService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers: IUser[]) => {
        this.users = receivedUsers;
      });

    this.form = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(64),
          customPatternValidator(loginMask),
          emailExistsValidator(this.users),
        ],
      ],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          customPatternValidator(usernameMask),
          usernameExistsValidator(this.users, { ...nullUser }),
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

  registration(): void {
    if (this.form.valid) {
      const maxId = Math.max(...this.users.map((u) => u.id));
      const userData: IUser = {
        ...{ ...nullUser },
        username: this.form.value.username,
        email: this.form.value.email,
        password: this.form.value.password,
        registrationDate: getCurrentDate(),
        id: maxId + 1,
      };

      this.usersService.postUser(userData).subscribe(() => {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.authService.setCurrentUser(userData);
        this.modalSuccessShow = true;
        const maxId = Math.max(...this.plans.map((u) => u.id));
        const newUserPlan = {
          ...nullPlan,
          id: maxId + 1,
          user: userData.id,
        };
        this.planService.addPlan(newUserPlan).subscribe();
        this.cd.markForCheck();
        (error: Error) => {
          console.error(
            'Регистрация | Ошибка в AuthService (loginUser): ' + error.message,
          );
        };
      });
    }
  }

  handleAreYouSureModalResult(result: boolean): void {
    if (result) {
      this.registration();
    }
    this.modalAreYouSureShow = false;
  }
  handleSuccessModalResult(): void {
    this.router.navigate(['/']);
    this.modalSuccessShow = false;
  }
  get passwordNotValidError(): string {
    return this.form.get('password')?.invalid &&
      (this.form.get('password')?.dirty || this.form.get('password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква'
      : '';
  }
  get emailNotValidError(): string {
    return !this.form.get('email')?.hasError('emailExists')
      ? this.form.get('email')?.invalid &&
        (this.form.get('email')?.dirty || this.form.get('email')?.touched)
        ? 'Введи корректный адрес электронной почты'
        : ''
      : '';
  }
  get usernameNotValidError(): string {
    return !this.form.get('username')?.hasError('usernameExists')
      ? this.form.get('username')?.invalid &&
        (this.form.get('username')?.dirty || this.form.get('username')?.touched)
        ? 'Имя пользователя должно содержать от 4 до 20 символов, среди которых могут быть буквы (минимум одна), цифры, а также нижние почеркивания и точки (не подряд)'
        : ''
      : '';
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
