import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-user-policy',
  templateUrl: './user-policy.component.html',
  styleUrls: ['./user-policy.component.scss']
})
export class UserPolicyComponent {

  constructor(titleService: Title) {
    titleService.setTitle('Пользовательское соглашение');
  }

}
