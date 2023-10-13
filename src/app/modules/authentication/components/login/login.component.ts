import { Component, OnInit } from '@angular/core';
import { passMask, emailOrUsernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
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
export class LoginComponent implements OnInit {
  loginMask = emailOrUsernameMask;
  passMask = passMask;

  login: string = '';
  pass: string = '';

  //данные от app-input
  getLogin(eventData: string) {
    this.login = eventData;
  }
  getPassword(eventData: string) {
    this.pass = eventData;
  }

  modalShow: boolean = false;
  modalErrorShow: boolean = false;
  constructor(
    private authService: AuthService,
    private titleService: Title,
    private router: Router,
    private usersService: UserService,
  ) {
    this.titleService.setTitle('Вход');
  }

  result: boolean = false;

  handleModalResult(result: boolean) {
    if (result) {
      this.result = true;
    } else {
      this.result = false;
    }
    this.modalShow = false;

    this.router.navigate(['/']);
  }

  handleModalErrorResult(result: boolean) {
    this.modalErrorShow = false;
  }

  failText: string = '';

  users: IUser[] = [];

  ngOnInit(): void {
    this.usersService.getUsers().subscribe((data: IUser[]) => {
      this.users = data;
    });
  }

  loginUser() {
    const user: IUser = {
      email: this.login,
      password: this.pass,
      username: this.login,
    };

    this.authService.loginUser(user).subscribe(
      (userExists) => {
        if (userExists) {
          console.log('Аутентификация успешна');

          localStorage.setItem('currentUser', JSON.stringify(userExists));

          this.authService.setCurrentUser(userExists);

          this.modalShow = true;
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

          this.modalErrorShow = true;
        }
      },
      (error: Error) => {
        console.error('Ошибка при проверке пользователя:', error);
      },
    );
  }
}
