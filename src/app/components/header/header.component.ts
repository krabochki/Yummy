import { animate, style, transition, trigger } from '@angular/animations';
import {
  Component,
  DoCheck,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { modal } from 'src/tools/animations';
modal;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('modal', modal()),
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
  currentUser: IUser = nullUser;

  role: string = 'user';

  notificationsCount = 10;

  @Output() headerHeightChange: EventEmitter<number> = new EventEmitter();

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResize(event: any) {
    if (event.target.innerWidth <= 481) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }

    const element = document.querySelector('.header') as HTMLElement | null;

    const height = element?.offsetHeight;

    this.headerHeightChange.emit(height);
  }


  activePage: 'cooks' | 'recipes' | 'match' | 'main' = 'main';
  constructor(
    public authService: AuthService,
    private router: Router,
  ) {

     this.router.events
       .pipe(filter((event) => event instanceof NavigationEnd))
       .subscribe(() => {
         const currentUrl = this.router.url;
         if (currentUrl.includes('recipes')) {
           this.activePage = 'recipes';
         } else if (currentUrl.includes('cooks')) {
           this.activePage = 'cooks';
         } else if (currentUrl.includes('match')) {
           this.activePage = 'match';
         }
         else if (currentUrl.includes('plan')) {
           this.activePage = 'recipes';

           }
         else if (currentUrl === '/') {
           this.activePage = 'main';
         }
       });
  }
  updateImageSrc() {
    throw new Error('Method not implemented.');
  }

  noAccessModalShow = false;

  linkClick() {
    if (this.currentUser.id === 0) {
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
