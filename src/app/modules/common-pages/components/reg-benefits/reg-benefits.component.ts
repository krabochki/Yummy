import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../../authentication/services/auth.service';
import { IUser } from '../../../user-pages/models/users';

@Component({
  selector: 'app-reg-benefits',
  templateUrl: './reg-benefits.component.html',
  styleUrl: '../../styles/common.scss',
})
export class RegBenefitsComponent implements OnInit {
  auth = false;

  constructor(
    title: Title,
    private authService: AuthService,
  ) {
    title.setTitle('Преимущества регистрации');
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.auth = receivedUser.id ? true : false;
    });
  }
}
