import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { loginMask } from 'src/tools/regex';
import { Title } from '@angular/platform-browser';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { customPatternValidator } from 'src/tools/validators';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { state } from 'src/tools/state';
import { AuthService } from '../../services/auth.service';
@Component({
  templateUrl: './password-recovery.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordRecoveryComponent implements OnInit, OnDestroy {
  successModal: boolean = false;
  loadingModal: boolean = false;
  users: IUser[] = [];
  form: FormGroup;
  errorModal: boolean = false;
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private titleService: Title,
    private fb: FormBuilder,
    private authService:AuthService,
    private cd: ChangeDetectorRef,
    private usersService: UserService,
  ) {
    this.titleService.setTitle('Восстановление пароля');

    this.form = this.fb.group({});
  }

  ngOnInit(): void {
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
          Validators.maxLength(64),
          customPatternValidator(loginMask),
        ],
      ],
    });
  }

  get loginNotValidError() {
    return !this.form.get('email')?.hasError('loginExists')
      ? this.form.get('email')?.invalid &&
        (this.form.get('email')?.dirty || this.form.get('login')?.touched)
        ? 'Введите корректный адрес электронной почты'
        : ''
      : ' ';
  }

  async passwordRecovery(): Promise<void> {
    if (this.form.valid) {
      const resetUser = { ...nullUser, email: this.form.get('email')?.value };
      try {
        this.loadingModal = true;

              const userInDatabase =
                await this.authService.loadUserFromSupabaseByEmail(
                  resetUser.email,
                );

        if (userInDatabase) {
          // Выполняем сброс пароля, используя email из формы
          const { error } = await supabase.auth.resetPasswordForEmail(resetUser.email, {
            redirectTo:
              state === 'dev'
                ? 'http://localhost:4200/#/password-reset'
                : 'https://yummy-kitchen.vercel.app/#/password-reset',
          });
          if (error) {
            console.log(error)
          }
          else {

            // Показываем модальное окно об успешной отправке ссылки на сброс пароля
            this.successModal = true;
            this.cd.markForCheck();
          }
        }
        else {
                    this.errorModal = true;

        }
      } catch (error) {
        if (error instanceof Error) {
          // Показываем модальное окно об ошибке
          this.errorModal = true;
        }
      } finally {
        this.loadingModal = false;
        this.cd.markForCheck();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
