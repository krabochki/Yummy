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
  policyValidator,
} from 'src/tools/validators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { usernameExistsValidator } from 'src/tools/validators';
import { getCurrentDate } from 'src/tools/common';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
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

  private createUser: IUser = { ...nullUser };
  private maxUserId = 0;
  private maxPlanId = 0;
  usernameValidator = usernameExistsValidator;

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
    private titleService: Title,
    private notifyService: NotificationService,
    private router: Router,
    private usersService: UserService,
    private fb: FormBuilder,
    private planService: PlanService,
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

  async registration() {
    if (this.form.valid) {
      this.loadingModal = true;
      this.cd.markForCheck();

      const userInDatabase = await this.authService.loadUserFromSupabaseByEmail(
        this.form.value.email,
      );

      if (userInDatabase !== null) {
        this.loadingModal = false;

        this.failText =
          'Почта, которую вы ввели, уже занята. Пожалуйста, измените данные и попробуйте ещё раз.';
        this.errorModal = true;
        this.cd.markForCheck();
      } else {
        await this.usersService.getMaxUserId().then((maxId) => {
          this.maxUserId = maxId;
        });

        await this.planService.getMaxPlanId().then((maxId) => {
          this.maxPlanId = maxId;
        });
        if (this.maxUserId !== 0 && this.maxPlanId !== 0) {
          const maxId = Math.max(...this.users.map((u) => u.id));
          const newUser: IUser = {
            ...{ ...nullUser },
            username: this.form.value.username,
            email: this.form.value.email,
            password: this.form.value.password,
            registrationDate: getCurrentDate(),
            id: maxId + 1,
          };
          this.createUser = newUser;

          const isUsernameTaken = this.users.some(
            (searchingUser) => searchingUser.username === newUser.username,
          );
          if (isUsernameTaken) {
            this.loadingModal = false;
            this.errorModal = true;
            this.failText =
              'Имя пользователя, которое вы ввели, уже занято. Пожалуйста, измените данные и попробуйте ещё раз.';
            this.cd.markForCheck();
            return;
          }
          const { error } = await this.authService.register(newUser);

          if (error) {
            this.errorModal = true;
          } else {
            await this.addUserToUsers(
              this.maxUserId + 1,
              newUser.username,
              newUser.email,
            );

            await this.addPlanToPlans(this.maxUserId + 1);
            await this.authService.logout();

            const notify = this.notifyService.buildNotification(
              'Добро пожаловать',
              `Добро пожаловать в Yummy, @${this.createUser.username} 🍾! Надеемся, вам понравится. Теперь вы имеете доступ ко всем функциям зарегистрированных кулинаров. Удачи!`,
              'success',
              'born',
              '',
            );
            await this.notifyService.sendNotification(notify, this.createUser);
            this.successModal = true;
          }
          this.loadingModal = false;
          this.cd.markForCheck();
        } else {
          this.failText =
            'Невозможно найти пользователей для присвоения вам уникального номера. Скорее всего, произошел сбой в работе сайта или сбой в вашем Интернет-подключении. Попробуйте перезагрузить страницу.';
          this.errorModal = true;
          this.loadingModal = false;

          this.cd.markForCheck();
        }
      }
    }
  }
  async addPlanToPlans(userId: number) {
    await this.planService.addPlanToSupabase({
      id: this.maxPlanId + 1,
      user: userId,
      calendarEvents: [],
      shoppingList: [],
    });
  }
  async addUserToUsers(id: number, username: string, email: string) {
    await this.usersService.addUserToSupabase(id, username, email);
  }

  handleConfirmModal(result: boolean): void {
    if (result) {
      this.registration();
    }
    this.confirmModal = false;
  }
  async handleSuccessModal() {
    this.successModal = false;
    this.router.navigate(['/']);
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
