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
import { customPatternValidator ,emailExistsValidator} from 'src/tools/validators';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { usernameExistsValidator } from 'src/tools/validators';
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
  form: FormGroup
  protected destroyed$: Subject<void> = new Subject<void>();

  createUser: IUser = nullUser;

  usernameValidator = usernameExistsValidator;

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
    })
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
           usernameExistsValidator(this.users, nullUser),
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
        ...nullUser,
        username: this.form.value.username,
        email: this.form.value.email,
        password: this.form.value.password,
        id: maxId + 1,
      };

        this.usersService.postUser(userData).subscribe(() => {
          localStorage.setItem('currentUser', JSON.stringify(userData));
          this.authService.setCurrentUser(userData);
          this.modalSuccessShow = true;
          this.cd.markForCheck();
          (error: Error) => {
            console.error(
              'Регистрация | Ошибка в AuthService (loginUser): ' +
                error.message,
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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
