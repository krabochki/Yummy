import { animate, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { loginMask, passMask, usernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [
    trigger('modal', [
      transition(':enter', [
        style({ opacity: '0' }),
        animate('300ms ease-out', style({ opacity: '1' })),
      ]),
      transition(':leave', [
        style({ opacity: '1' }),
        animate('300ms ease-in', style({ opacity: '0' })),
      ]),
    ]),
  ],
})
export class RegisterComponent {
  emailMask = loginMask; //маска для почты
  passMask = passMask; //маска для пароля
  usernameMask = usernameMask;

  email: string = '';
  pass: string = '';
  username: string = '';

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

  modalShow: boolean = false;
  modalSuccessShow: boolean = false;
  modalFailShow: boolean = false;

  failText: string = '';
  handleModalResult(result: boolean) {
    if (result) {
      this.registration();
    }
    this.modalShow = false;
  }
  handleSuccessModalResult(result: boolean) {
    if (result) {
      this.router.navigate(['/']);
    }
    this.modalSuccessShow = false;
  }
  handleFailModalResult(result:boolean) {
    this.modalFailShow = false;
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
    this.usersService.getUsers().subscribe((users: any) => {
      this.users = users;
    });
  }

  users: IUser[] = [];
  registration() {
    const user: IUser = {
      email: this.email,
      password: this.pass,
      username: this.username,
      role: 'user',
    };

    const emailExists = this.users.find((u) => u.email === user.email);
    const usernameExists = this.users.find((u) => u.username === user.username);

    console.log(emailExists);
    console.log(usernameExists);
    if (emailExists == undefined && usernameExists == undefined) {
      this.authService.registerUser(user).subscribe(
        (userExists) => {
          if (userExists) {
            localStorage.setItem('currentUser', JSON.stringify(userExists));
            this.authService.setCurrentUser(userExists);
            this.modalSuccessShow = true;
          }
        },
        (error) => {
          console.error('Ошибка подписки', error);
        },
      );
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
          'Регистрация невозможна, так как пользователь(-и) с данной электронной почтой и именем пользователя уже существует.';
      }
      this.modalFailShow = true;
    }
  }
}
