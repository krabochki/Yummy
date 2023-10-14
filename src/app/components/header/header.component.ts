import { animate, style, transition, trigger } from '@angular/animations';
import { Component, DoCheck, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser } from 'src/app/modules/user-pages/models/users';
import { modal } from 'src/tools/animations';
modal
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('modal', modal()),
    trigger('settingsMobile', [
      transition(':enter', [
        style({ opacity: '0' }),
        animate('300ms ease-out', style({ opacity: '1' })),
      ]),
      transition(':leave', [
        style({ opacity: '1' }),
        animate('300ms ease-in', style({ opacity: '0' })),
      ]),
    ]),
  ],
})
export class HeaderComponent implements OnInit, DoCheck {
  recipeSelectItems: string[] = [
    'Рецепты',
    'Ваши рецепты',
    'Все рецепты',
    'Все категории',
    'Закладки',
    'Подбор рецептов',
  ];
  cooksSelectItems: string[] = [
    'Кулинары',
    'Ваш профиль',
    'Все кулинары',
    'Обновления',
  ];

  mobile: boolean = false;
  hambOpen: boolean = false;
  currentUserSubscription?: Subscription;
  currentUser?: IUser | null;

  role: string | undefined = 'user';

  notificationsCount = 10;

  @Output() headerHeightChange: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    if (screen.width <= 480) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }

    this.currentUserSubscription = this.authService
      .getCurrentUser()
      .subscribe((data) => {
        this.currentUser = data;

        this.role = this.currentUser?.role;
      });
  }
  ngDoCheck() {
    const element = document.querySelector('.header') as HTMLElement | null;
    const height = element?.offsetHeight;

    this.headerHeightChange.emit(height);
  }

  closeSettings() {
    this.hambOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth <= 480) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }

    const element = document.querySelector('.header') as HTMLElement | null;

    const height = element?.offsetHeight;

    this.headerHeightChange.emit(height);
  }

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  noAccessModalShow = false;

  linkClick() {

    if (!this.currentUser) {
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
            window.scrollTo(0, 0);
  }

}
