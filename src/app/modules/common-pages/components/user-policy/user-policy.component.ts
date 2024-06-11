import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { policyGroups } from './const';

@Component({
  selector: 'app-user-policy',
  templateUrl: './user-policy.component.html',
  styleUrls: ['../../styles/common.scss'],
})
export class UserPolicyComponent {
  policyGroups = policyGroups;
  constructor(titleService: Title) {
    titleService.setTitle('Пользовательское соглашение');
  }
}
