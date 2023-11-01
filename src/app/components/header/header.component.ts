import { trigger } from '@angular/animations';
import {
  Component,
  DoCheck,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { modal } from 'src/tools/animations';
modal;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [trigger('modal', modal())],
})
export class HeaderComponent implements OnInit, DoCheck, OnDestroy {
  recipeSelectItems: string[] = [
    'Рецепты',
    'Твои рецепты',
    'Все рецепты',
    'Разделы',
    'Закладки',
    'Подбор рецептов',
  ];
  creatingMode = false;
  cooksSelectItems: string[] = [
    'Кулинары',
    'Твой профиль',
    'Все кулинары',
    'Обновления',
  ];

  recipeRouterLinks: string[] = [
    '/recipes/yours',
    '/recipes',
    '/sections',
    '/recipes/favorite',
    '/match',
  ];
  cookRouterLinks: string[] = ['/cooks/list/', '/cooks', '/cooks/updates'];

  notifiesOpen: boolean = false;
  mobile: boolean = false;
  currentUser: IUser = { ...nullUser };
  notifies: INotification[] = [];
  user: IUser = nullUser;
  noAccessModalShow: boolean = false;
  activePage: 'cooks' | 'recipes' | 'match' | 'main' = 'main';
  @Output() headerHeight: EventEmitter<number> = new EventEmitter();
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    public authService: AuthService,
    public userService: UserService,
    private router: Router,
  ) {
    //узнаем на какой странице сейчас пользователь для навигации на мобильной версии
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentUrl = this.router.url;
        switch (true) {
          case currentUrl.includes('recipes'):
            this.activePage = 'recipes';
            break;
          case currentUrl.includes('cooks'):
            this.activePage = 'cooks';
            break;
          case currentUrl.includes('match'):
            this.activePage = 'match';
            break;
          case currentUrl.includes('plan'):
            this.activePage = 'recipes';
            break;
          default:
            this.activePage = 'main';
        }
      });
  }

  ngOnInit(): void {
    if (screen.width <= 480) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser) => {
        this.currentUser = receivedUser;
        this.cookRouterLinks[0] = '/cooks/list/' + this.currentUser.id;
      });
    this.userService.users$.pipe(takeUntil(this.destroyed$)).subscribe(
      (users) => {
        
        const find = users.find((u) => u.id === this.currentUser.id);
        if (find) {
          this.user = find;
          const userNotifies = this.user.notifications.sort((n1, n2) => {
            const date1 = new Date(n1.timestamp);
            const date2 = new Date(n2.timestamp);
            if (date1.getTime() > date2.getTime()) {
              return -1;
            } else {
              return 1;
            }
          });  
          this.notifies = userNotifies;
        }
      
      }
    )
  }


  get notificationCount() {
    return this.user.notifications.filter((n)=> n.read===false).length
  }

  ngDoCheck(): void {
    this.headerHeightChange();
  }

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResize(event: any): void {
    if (event.target.innerWidth <= 481) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }
    this.headerHeightChange();
  }

  headerHeightChange(): void {
    const element = document.querySelector('.header') as HTMLElement | null;
    const height = element?.offsetHeight;
    this.headerHeight.emit(height);
  }

  linkClick(): void {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
    }
  }

  handleNoAccessModal(event: boolean): void {
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
