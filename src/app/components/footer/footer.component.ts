import { trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { modal } from 'src/tools/animations';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit, OnDestroy {
  currentUser: IUser = { ...nullUser };
  protected destroyed$: Subject<void> = new Subject<void>();

  noAccessModalShow = false;

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

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser) => (this.currentUser = receivedUser));
  }

  linkClick(): void {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
    }
  }
  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
