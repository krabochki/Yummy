import { trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { modal } from 'src/tools/animations';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  animations: [trigger('modal', modal())],
})
export class FooterComponent implements OnInit {
  currentUserSubscription: Subscription = new Subscription();
  currentUser: IUser  = nullUser;

  links = [
    ['pinterest', 'http://pinterest.com'],
    ['vkontakte', 'http://vk.com'],
    ['twitter', 'http://twitter.com'],
    ['facebook', 'http://facebook.com'],
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUserSubscription = this.authService
      .getCurrentUser()
      .subscribe((receivedUser) => {
        this.currentUser = receivedUser;
      });
  }

  noAccessModalShow = false;

  linkClick() {
    if (this.currentUser.id===0) {
      this.noAccessModalShow = true;
    }
  }
  handleNoAccessModal(event: boolean) {
    if (event) {
      this.scrollTop();

      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }
  scrollTop() {
          window.scrollTo(0,0)
  }
}
