import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { passMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  EMPTY,
  Subject,
  catchError,
  finalize,
  forkJoin,
  pipe,
  tap,
} from 'rxjs';
import { customPatternValidator } from 'src/tools/validators';
@Component({
  templateUrl: './password-reset.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetComponent implements OnInit {
  successModal: boolean = false;
  loadingModal = false;
  error = '';
  users: IUser[] = [];
  form: FormGroup;

  errorModal = false;
  protected destroyed$: Subject<void> = new Subject<void>();

  user = nullUser;

  goHereFromUrl = false;

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router,
  ) {
    this.titleService.setTitle('Сброс пароля');

    this.form = this.fb.group({});
  }
  async handleSuccessModalResult() {
    this.successModal = false;
    this.authService.logout().subscribe(() => {
      this.authService.setCurrentUser(nullUser);
      this.router.navigateByUrl('/login');
    });
  }
  currentUser: IUser = nullUser;

  ngOnInit() {
    this.form = this.fb.group({
      old_password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          customPatternValidator(passMask),
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

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.authService.getTokenUser().subscribe((user) => {
      if (user.id) {
        this.goHereFromUrl = false;
      } else {
        this.goHereFromUrl = true;

            this.form = this.fb.group({
              
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

        this.routeInit();
      }
    });
  }

  routeInit() {
    this.route.queryParams.subscribe((queryParam) => {
      const token = queryParam['token'];

      if (token) {
        this.authService
          .findUserByResetToken(token)
          .pipe(
            tap((resetTokenUser) => {
              forkJoin([
                this.authService.removeResetTokenFromUser(resetTokenUser.id),
                this.authService.autologinUser(resetTokenUser),
              ]).subscribe(() => {
                this.authService
                  .getTokenUser()
                  .pipe(
                    tap((tokenUser) => {

                      this.authService
                        .getNotificationsByUser(tokenUser.id)
                        .subscribe((notifies) => {
                          tokenUser.notifications = notifies;
                          tokenUser.init = true;
                          this.authService.setCurrentUser(tokenUser);
                          this.cd.markForCheck();
                        });
                      
                    }),
                  )
                  .subscribe();
              });
            }),
            catchError(() => {
              this.router.navigateByUrl('/');
              return EMPTY;
            }),
          )
          .subscribe();
      } else {
        this.router.navigateByUrl('/');
      }
    });
  }

  get passwordNotValidError() {
    return this.form.get('password')?.invalid &&
      (this.form.get('password')?.dirty || this.form.get('password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква'
      : '';
  }

  get oldPasswordNotValidError() {
    return this.form.get('old_password')?.invalid &&
      (this.form.get('old_password')?.dirty ||
        this.form.get('old_password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква'
      : '';
  }

  passwordReset() {
    if (this.form.valid) {
      const newPassword = this.form.value.password;
      const oldPassword = this.form.value.old_password;

      const changePassword$ = this.goHereFromUrl
        ? this.authService.changePassword(this.currentUser.id, newPassword)
        : this.authService.secureChangePassword(
            this.currentUser.id,
            newPassword,
            oldPassword,
          );
      changePassword$
        .pipe(
          tap(() => {
            this.successModal = true;
          }),
          catchError((response) => {
            const error = response.error.error;
            this.error = error || '';
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
}
