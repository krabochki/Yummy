import { Component } from '@angular/core';
import { passMask,loginMask, usernameMask } from 'src/tools/regex';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../../common-styles.scss'],
})
export class RegisterComponent {
  loginMask = loginMask; //маска для почты
  passMask = passMask; //маска для пароля
  usernameMask = usernameMask;

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
