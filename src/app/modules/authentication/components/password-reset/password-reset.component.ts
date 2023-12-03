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
import { Subject } from 'rxjs';
import { customPatternValidator } from 'src/tools/validators';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
@Component({
  templateUrl: './password-reset.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetComponent implements OnInit {
  successModal: boolean = false;
  loadingModal = false;
  infoError = '';
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
    if (!this.goHereFromUrl) {
      this.router.navigateByUrl('/login');
    } else this.router.navigateByUrl('/');
  }
  currentUser: IUser = nullUser;

  async ngOnInit() {
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

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    const hashParams = window.location.hash
      .substring(1)
      .replace('/password-reset#', '');

    if (this.currentUser.id === 0) {
      const result = this.authService.loginUserWithToken(hashParams);
      if (result !== false) {
        this.goHereFromUrl = true;
        const { error } = await result;
        if (error) {
          this.router.navigateByUrl('/');
        }
      } else {
        this.router.navigateByUrl('/');
      }
    }
  }

  get passwordNotValidError() {
    return this.form.get('password')?.invalid &&
      (this.form.get('password')?.dirty || this.form.get('password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква'
      : '';
  }

  async passwordReset(): Promise<void> {
    if (this.form.valid) {
      try {
        this.loadingModal = true;
        this.cd.markForCheck();
        const { error } = await supabase.auth.updateUser({
          password: this.form.get('password')?.value,
        });
        if (error) {
          if (
            error.message ===
            'New password should be different from the old password.'
          )
            this.infoError = 'Новый пароль должен отличаться от старого';
          else {
            this.infoError =
              'Произошла неизвестная ошибка при попытке сброса пароля';
          }
          this.errorModal = true;
        } else {
          this.successModal = true;
          if (!this.goHereFromUrl) {
            this.authService.logoutUser();
            await this.authService.logout();
          }
        }
      } catch {
        this.errorModal = true;
      } finally {
        this.loadingModal = false;
        this.cd.markForCheck();
      }
    }
  }
}
