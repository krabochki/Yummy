import { trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { loginMask, passMask, usernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { modal } from 'src/tools/animations';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
})
export class RegisterComponent implements OnInit, OnDestroy {
  emailMask = loginMask; //маска для почты
  passMask = passMask; //маска для пароля
  usernameMask = usernameMask;
  email: string = '';
  pass: string = '';
  username: string = '';
  modalAreYouSureShow: boolean = false;
  modalSuccessShow: boolean = false;
  modalFailShow: boolean = false;
  failText: string = '';
  users: IUser[] = [];
  usersSubscription?: Subscription;

  get testUserData() {
    return (
      this.emailMask.test(this.email) &&
      this.usernameMask.test(this.username) &&
      this.passMask.test(this.pass)
    );
  }

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private router: Router,
    private usersService: UserService,
  ) {
    this.titleService.setTitle('Регистрация');
  }

  ngOnInit() {
    this.usersSubscription = this.usersService.users$.subscribe(
      (users: IUser[]) => {
        this.users = users;
      },
    );
  }

  //данные от app-input
  getEmail(eventData: string) {
    this.email = eventData;
  }
  getPassword(eventData: string) {
    this.pass = eventData;
  }
  getUsername(eventData: string) {
    this.username = eventData;
  }

  registration() {
    const user = {
      ...nullUser,
      email: this.email,
      password: this.pass,
      username: this.username,
    };

    const maxId = Math.max(...this.users.map((u) => u.id));
    user.id = maxId + 1;

    const emailExists = this.authService.isEmailExist(this.users, user.email);
    const usernameExists = this.authService.isUsernameExist(
      this.users,
      user.username,
    );

    if (!emailExists && !usernameExists) {
      this.usersService.postUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.authService.setCurrentUser(user);
      this.modalSuccessShow = true;
    } else {
      if (emailExists) {
        this.failText =
          'Регистрация невозможна, так как пользователь с данной электронной почтой уже существует.';
      }
      if (usernameExists) {
        this.failText =
          'Регистрация невозможна, так как пользователь с данным именем пользователя уже существует.';
      }
      if (usernameExists && emailExists) {
        this.failText =
          'Регистрация невозможна, так как пользователь с данной электронной почтой и именем пользователя уже существует.';
      }
      this.modalFailShow = true;
    }
  }

  handleAreYouSureModalResult(result: boolean) {
    if (result) {
      this.registration();
    }
    this.modalAreYouSureShow = false;
  }
  handleSuccessModalResult() {
    this.router.navigate(['/']);
    this.modalSuccessShow = false;
  }
  handleFailModalResult() {
    this.modalFailShow = false;
  }

  ngOnDestroy() {
    this.usersSubscription?.unsubscribe();
  }
}
