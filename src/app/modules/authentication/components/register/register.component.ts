import { trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { loginMask, passMask, usernameMask } from 'src/tools/regex';
import { AuthService } from '../../services/auth.service';
import { modal } from 'src/tools/animations';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
  animations: [trigger('modal', modal())],
})
export class RegisterComponent implements OnInit{
  
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleFailModalResult(result: boolean) {
    this.modalFailShow = false;
  }

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private router: Router,
    private usersService: UserService,
    
  ) {
   
     router.events.subscribe(() => {
       window.scrollTo(0,0)
     });
    this.titleService.setTitle('Регистрация');
  }

  ngOnInit() {
    this.usersService.getUsers().subscribe((users: IUser[]) => {
      this.users = users;
    });
  }

  users: IUser[] = [];
  registration() {
    const user = nullUser;
    user.email = this.email;
    user.password = this.pass;
    user.username = this.username;

      const maxId = Math.max(...this.users.map((u) => u.id));
  user.id = maxId + 1;


    const emailExists = this.users.find((u) => u.email === user.email);
    const usernameExists = this.users.find((u) => u.username === user.username);

    if (emailExists === undefined && usernameExists === undefined) {
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
