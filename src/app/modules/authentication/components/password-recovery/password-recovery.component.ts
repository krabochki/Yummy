import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { loginMask } from 'src/tools/regex';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, finalize, tap } from 'rxjs';
import { customPatternValidator } from 'src/tools/validators';
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
  form: FormGroup;
  errorModal: boolean = false;
  error = '';
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private titleService: Title,
    private fb: FormBuilder,
    private authService:AuthService,
    private cd: ChangeDetectorRef,
  ) {
    this.titleService.setTitle('Восстановление пароля');

    this.form = this.fb.group({});
  }

  ngOnInit(): void {

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

   passwordRecovery(){
    if (this.form.valid) {
      const email = this.form.get('email')?.value;
      this.loadingModal = true;
      this.authService.forgotPassword(email)
        .pipe(
          tap(
            () => {
              this.successModal = true;
            }
            
          ),
          catchError(
            (response) => {
              this.error = response.error.message || '';
              this.errorModal = true;
              return EMPTY;
            }
          ),
          finalize(
            () => {
              this.loadingModal = false;
              this.cd.markForCheck();
            }
          )
        )
        .subscribe()
    }
      
      
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
