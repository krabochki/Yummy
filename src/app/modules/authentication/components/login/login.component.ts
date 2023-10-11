import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../common-styles.scss'],
})
export class LoginComponent {
  loginMask = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/; //маска для почты
  passMask = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/; //маска для пароля

  login: string = '';
  pass: string = '';

  //данные от app-input
  getLogin(eventData: string) {
    this.login = eventData;
  }
  getPassword(eventData: string) {
    this.pass = eventData;
  }
}
