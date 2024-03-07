import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import {
  ThemeService,
  themeUI,
} from 'src/app/modules/common-pages/services/theme.service';
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

  mode: 'dark' | 'light' = 'light';

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.themeService.themeSubject.subscribe(
      (theme: themeUI) => {
        this.mode = theme;
      },
    );

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser) => {
        this.currentUser = receivedUser;
        this.cd.markForCheck();
      });
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

  nightModeEmit($event: boolean) {
    this.themeService.changeTheme() 
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
