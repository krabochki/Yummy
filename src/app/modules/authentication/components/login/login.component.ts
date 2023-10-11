import { Component } from '@angular/core';
import { passMask, loginMask } from 'src/tools/regex';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../../common-styles.scss'],
})
export class LoginComponent {
  loginMask = loginMask
  passMask = passMask

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
