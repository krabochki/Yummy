import { Component, OnDestroy, OnInit } from '@angular/core';
import { passMask, emailOrUsernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginMask = emailOrUsernameMask;
  passMask = passMask;
  login: string = '';
  pass: string = '';
  successModalShow: boolean = false;
  errorModalShow: boolean = false;
  failText: string = '';
  users: IUser[] = [];
  usersSubscription?: Subscription;

  get testUserData(): boolean {
    return this.loginMask.test(this.login) && this.passMask.test(this.pass);
  }

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private usersService: UserService,
    private router: Router,
  ) {
    this.titleService.setTitle('Вход');
  }

  ngOnInit(): void {
    this.usersSubscription = this.usersService.users$.subscribe(
      (data: IUser[]) => {
        this.users = data;
      },
    );
  }

  loginUser() {
    const user = {
      ...nullUser,
      email: this.login,
      password: this.pass,
      username: this.login,
    };

    this.authService.loginUser(user).subscribe(
      (userExists) => {
        if (userExists) {
          localStorage.setItem('currentUser', JSON.stringify(userExists));
          this.authService.setCurrentUser(userExists);
          this.successModalShow = true;
        } else {
          const user = this.users.find(
            (user) => user.email === this.login || user.username === this.login,
          );
          if (user != undefined) {
            this.failText =
              'Неправильный пароль. Попробуйте ввести данные снова или восстановить пароль.';
          } else {
            this.failText =
              'Пользователя с такими данными не существует. Попробуйте перепроверить данные или зарегистрируйтесь.';
          }
          this.errorModalShow = true;
        }
      },
      (error: Error) => {
        console.error('Ошибка при проверке пользователя:', error);
      },
    );
  }

  //данные от app-input
  getLogin(typedLogin: string) {
    this.login = typedLogin;
  }
  getPassword(typedPassword: string) {
    this.pass = typedPassword;
  }

  handleErrorModalResult() {
    this.errorModalShow = false;
  }
  handleSuccessModalResult() {
    this.successModalShow = false;
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.usersSubscription?.unsubscribe();
  }
}
