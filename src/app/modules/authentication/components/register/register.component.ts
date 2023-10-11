import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
})
export class RegisterComponent {
  loginMask = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/; //маска для почты
  passMask = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/; //маска для пароля
  usernameMask = /^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]{4,20}$/;

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
