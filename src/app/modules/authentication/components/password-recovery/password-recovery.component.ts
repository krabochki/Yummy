import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {  loginMask } from 'src/tools/regex';
import { Title } from '@angular/platform-browser';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  customPatternValidator,
} from 'src/tools/validators';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
@Component({
  templateUrl: './password-recovery.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordRecoveryComponent implements OnInit, OnDestroy {
  successModal: boolean = false;
  loadingModal:boolean = false;
  users: IUser[] = [];
  form: FormGroup;
  errorModal:boolean = false;
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private titleService: Title,
    private fb: FormBuilder,
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
        const finded = this.users.find((u) => u.email === resetUser.email);

        if (!finded) {
          this.errorModal = true;
        } else {
          await supabase.auth.resetPasswordForEmail(resetUser.email, {
            redirectTo:
              'https://yummy-kitchen.vercel.app/#/password-reset',
          });
          this.successModal = true;
          this.cd.markForCheck();
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


  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
