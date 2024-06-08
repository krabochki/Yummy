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
  resetToken: string = '';
  userId = 0;

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
            this.initMaxForm();

  }
  handleSuccessModalResult() {
    this.successModal = false;
      this.authService.setCurrentUser(nullUser);

    this.router.navigateByUrl('/login');

    
  }
  currentUser: IUser = nullUser;

  ngOnInit() {
    this.checkSource();

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  private checkSource() {
    this.authService.getTokenUser().subscribe((user) => {
      if (user.id) {
        this.goHereFromUrl = false;
      } else {
        this.goHereFromUrl = true;
        this.initMinForm();
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
            tap((userId: number) => {
              this.userId = userId;
              this.resetToken = token;
              this.cd.markForCheck();
            }),

            finalize(() => {
              this.loadingModal = false;
              this.cd.markForCheck();
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

  passwordReset() {
    
    if (this.form.valid) {
      const newPassword = this.form.value.password;
      const oldPassword = this.form.value.old_password;

      this.loadingModal = true;

      const changePassword$ = this.goHereFromUrl
        ? this.authService.changePassword(
            this.userId,
            newPassword,
            this.resetToken,
          )
        : this.authService.secureChangePassword(
            newPassword,
            oldPassword,
          );
      changePassword$
        .pipe(
          tap(() => {
            this.authService
              .logout()
              .pipe(
                finalize(() => {
                  this.loadingModal = false;
                  this.cd.markForCheck();
                }),
              )
              .subscribe(() => {
                this.successModal = true;
              });
          }),
          catchError((response) => {
            const error = response.error.error;
            this.loadingModal = false;
            this.error = error || '';
            this.errorModal = true;
            this.cd.markForCheck();
            return EMPTY;
          }),
          
        )
        .subscribe();
    }
  }

  private initMaxForm() {
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
  }

  private initMinForm() {
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
}
