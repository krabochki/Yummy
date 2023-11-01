import { trigger } from '@angular/animations';
import {
  ChangeDetectorRef,
  Component,
  DoCheck,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { cookRouterLinks, cooksSelectItems, recipeRouterLinks, recipeSelectItems, recipeRoutes, userRoutes } from './consts';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { count, modal, notifies } from 'src/tools/animations';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('modal', modal()),
    trigger('notifies', notifies()),
    trigger('count', count()),
  ],
})
export class HeaderComponent implements OnInit, DoCheck, OnDestroy {
  @Output() headerHeight: EventEmitter<number> = new EventEmitter();

  activePage: 'cooks' | 'recipes' | 'match' | 'main' = 'main';

  recipeRouterLinks = recipeRouterLinks;
  recipeSelectItems = recipeSelectItems;
  cooksSelectItems = cooksSelectItems;
  cookRouterLinks = cookRouterLinks;

  creatingMode = false;

  currentUser: IUser = { ...nullUser };
  users: IUser[] = [];

  notifiesOpen: boolean = false;
  notifies: INotification[] = [];

  mobile: boolean = false;

  noAccessModalShow: boolean = false;

  baseSvgPath: string = '../../../assets/images/svg/';

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    public authService: AuthService,
    public userService: UserService,
    public cd: ChangeDetectorRef,
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

  get recipeRoutes() {
    return recipeRoutes(this.currentUser.id);
  }
  get userRoutes() {
    return userRoutes(this.currentUser.id)
  }

  get notificationCount() {
    if (this.currentUser.notifications)
      return this.currentUser.notifications.filter((n) => n.read === false)
        .length;
    else return 0;
  }

  ngOnInit(): void {
    if (screen.width <= 480) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }
    this.usersInit();
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

  currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser) => {
        if (receivedUser.id !== 0) {
          if (this.currentUser.id !== receivedUser.id) {
            const findUser = this.users.find((u) => u.id === receivedUser.id);
            if (findUser) {
              this.cookRouterLinks[0] = '/cooks/list/' + this.currentUser.id;
              this.currentUser = findUser;
              this.notifies = [];
              this.updateNotifies();
            }
          }
        } else this.currentUser = receivedUser;
      });
  }

  usersInit() {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((users) => {
        this.users = users;
        this.currentUserInit();
        this.updateNotifies();
      });
  }

  makeNotifiesUnreaded() {
    let haveNotRead: boolean = false;
    this.notifies.forEach((notification) => {
      if (notification.read === false) {
        haveNotRead = true;
      }
      notification.read = true;
    });

    if (haveNotRead) this.userService.updateUsers(this.currentUser).subscribe();
  }

  updateNotifies() {
    if (this.currentUser.notifications) {
      const userNotifies = [...this.currentUser.notifications];

      if (this.notifies) {
        userNotifies.forEach((notification) => {
          if (!this.notifies.some((n) => n.id === notification.id)) {
            this.notifies.unshift(notification);
          }
        });
      } else {
        this.notifies = userNotifies;
        this.cd.markForCheck();
      }
    }
  }

  headerHeightChange(): void {
    const element = document.querySelector('.header') as HTMLElement | null;
    const height = element?.offsetHeight;
    this.headerHeight.emit(height);
  }

  linkClick(link: string): void {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
    }
    else {
      this.router.navigateByUrl(link)
    }
  }

  svgPath(svg: string) {
    return this.baseSvgPath + svg + '.svg';
  }
  isActiveSvgPath(svg: string, activePage: string) {
    return this.baseSvgPath + '/header/' + svg +
      (this.activePage === activePage ? '-active' : '') +
      '.svg'
  }
  svgActiveClass(activePage: string) {
    return this.activePage === activePage ? 'header-svg active' : 'header-svg';
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
