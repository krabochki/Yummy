import { Component, OnInit } from '@angular/core';
import { passMask, emailOrUsernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
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
    private usersService: UserService,
    private router:Router
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   
    const user = nullUser;
    user.email = this.login;
    user.password = this.pass;
    user.username = this.login;
     
    

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
