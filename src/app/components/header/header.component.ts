import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import {
  cookRouterLinks,
  cooksSelectItems,
  recipeRouterLinks,
  recipeSelectItems,
  recipeRoutes,
  userRoutes,
  planSelectItems,
  planRouterLinks,
  planRoutes,
} from './consts';
import { NavigationEnd, Router } from '@angular/router';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  filter,
  forkJoin,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import {
  count,
  heightAnim,
  modal,
  notifies,
  popup,
} from 'src/tools/animations';
import { PlanService } from 'src/app/modules/planning/services/plan.service';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { TimePastService } from 'ng-time-past-pipe';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { ThemeService } from 'src/app/modules/common-pages/services/theme.service';
import { ICalendarDbEvent } from 'src/app/modules/planning/models/calendar';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { id } from 'date-fns/locale';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('modal', modal()),
    trigger('notifies', notifies()),
    trigger('height', heightAnim()),
    trigger('count', count()),
    trigger('popup', popup()),
  ],
})
export class HeaderComponent implements OnInit, DoCheck, OnDestroy {
  @Output() headerHeight: EventEmitter<number> = new EventEmitter();

  popups: INotification[] = [];
  popupHistory: number[] = [];

  activePage: 'cooks' | 'recipes' | 'calendar' | 'main' = 'main';

  recipeRouterLinks = recipeRouterLinks;
  recipeSelectItems = recipeSelectItems;
  cooksSelectItems = cooksSelectItems;

  mobileRecipeSelectItems = recipeSelectItems.slice(1, 9);
  mobileCooksSelectItems = cooksSelectItems.slice(1, 4);
  mobilePlanSelectItems = planSelectItems.slice(1, 4);

  cookRouterLinks = cookRouterLinks;
  planSelectItems = planSelectItems;
  planRouterLinks = planRouterLinks;

  notReadedNotifies = 0;

  mobileMenuOpen = false;

  mobileSectionsOpen = [false, false, false];

  maxNumberOfPopupsInSameTime = 3;
  popupLifetime = 5; //в секундах

  adminActionsCount = 0;

  creatingMode = false;

  currentUser: IUser = { ...nullUser };

  exitModalShow = false;
  notifiesOpen: boolean = false;

  mobile: boolean = false;

  avatar: string = '';

  noAccessModalShow: boolean = false;

  baseSvgPath: string = '/assets/images/svg/';

  protected destroyed$: Subject<void> = new Subject<void>();

  get recipeRoutes() {
    return recipeRoutes(this.currentUser.id);
  }
  get userRoutes() {
    return userRoutes(this.currentUser.id);
  }
  get planRoutes() {
    return planRoutes(this.currentUser.id);
  }

  notifiesClick() {
    this.notifiesOpen = false;
  }

  hamburgerClick() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
        this.popups = [];

    if (this.mobileMenuOpen) this.addModalStyle();
      
    else {
      this.removeModalStyle(); 
          this.mobileSectionsOpen = [false, false, false];


    }
  }

  private removeModalStyle(): void {
    removeModalStyle(this.renderer);
  }

  private addModalStyle(): void {
    addModalStyle(this.renderer);
  }

  clickMobileMenuLink(link: string) {
    this.router.navigateByUrl(link);
    this.removeModalStyle();
    this.mobileMenuOpen = false;
    this.mobileSectionsOpen = [false, false, false];
  }

  protected nightModeEmit() {
    this.themeService.changeTheme();
  } //переключ темной темы

  get showAdminpanel() {
    return this.userService.getPermission(
      this.currentUser.limitations || [],
      Permission.AdminPanelButton,
    );
  }

  constructor(
    public authService: AuthService,
    public userService: UserService,
    private renderer: Renderer2,
    private themeService: ThemeService,
    public cd: ChangeDetectorRef,
    private notifyService: NotificationService,
    private router: Router,
    private timePastService: TimePastService,
    private planService: PlanService,
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
          case currentUrl.includes('calendar'):
            this.activePage = 'calendar';
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
      this.maxNumberOfPopupsInSameTime = 1;
      this.mobile = true;
    } else {
      this.mobile = false;
    }
    this.currentUserInit();
    this.authService.dashboardOpened$.subscribe(() => {
      this.adminActionsCount = 0;
    });

  }

  private sendDarkModeNotify() {
    if (
      localStorage.getItem('theme') === (undefined || 'light') &&
      (new Date().getHours() > 20 || new Date().getHours() < 6)
    ) {
      const todayDate = new Date();
      const dd = String(todayDate.getDate()).padStart(2, '0');
      const mm = String(todayDate.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = todayDate.getFullYear();
      const today: string = mm + '/' + dd + '/' + yyyy;
      if (today !== localStorage.getItem('last-darkmode-notify')) {
        localStorage.setItem('last-darkmode-notify', today);

        const notification = this.notifyService.buildNotification(
          'А в Yummy есть тёмная тема!',
          'Если вам не комфортно смотреть на яркие и светлые цвета, то нажмите на это уведомление, чтобы включить темный режим. ',
          'night-mode',
          'without',
          '',
        );
        notification.id = -100;
        this.nightModePopupLifecycle(notification);
      }
    }
  }

  ngDoCheck(): void {
    this.headerHeightChange();
  }

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResize(event: any): void {
    if (event.target.innerWidth <= 480) {
      this.mobile = true;
    } else {
      if (this.mobileMenuOpen) {
        this.removeModalStyle();
        this.mobileMenuOpen = false;
      }   this.mobileSectionsOpen = [false, false, false];

      this.mobile = false;
    }
    this.headerHeightChange();
    this.cd.markForCheck();
  }

  notifyForUpcomingEvents(events: ICalendarDbEvent[]) {
    let counter = 0;
    const eventTitles: string[] = events.map((event) => {
      counter++;
      const when = ` (начало ${this.timePastService
        .timePast(event.start)
        .toLowerCase()})`;
      return (
        'ㅤ' +
        (events.length > 1 ? counter + ') ' : '') +
        `"${event.title.trim()}"` +
        when
      );
    });
    const eventsString = eventTitles.join(', <br>');

    const eventString = `Запланированный рецепт: ${eventTitles[0].replace(
      'ㅤ',''
    )}.`;

    const moreEvents = `Запланированные рецепты:<br>${eventsString}`;

    const reminderText = `У вас запланирован${
      events.length > 1 ? 'ы' : ''
    } рецепт${
      events.length > 1 ? 'ы' : ''
    } на ближайшее время. Не забудьте проверить список ингредиентов и подготовьтесь к приготовлению ${
      events.length > 1 ? 'этих вкусных блюд' : 'этого вкусного блюда'
    }.<br>${events.length===1?eventString:moreEvents}`;
    const reminder: INotification = {
      ...this.notifyService.buildNotification(
        'Начало запланированного рецепта уже скоро!',
        reminderText,
        'warning',
        'plan-reminder',
        '/plan/calendar',
      ),
      notificationDate: this.shortTodayDate,
    };

    return reminder;
  }

  shortTodayDate = new Date().toDateString();

  notifyForStartedEvents(event: ICalendarDbEvent) {
    return {
      ...this.notifyService.buildNotification(
        'Время начала запланированного рецепта настало!',
        'Время начала запланированного вами рецепта «' +
          event.title +
          '» уже настало! Не забудьте проверить список ингредиентов и начните готовить это вкусное блюдо. Удачи!',
        'warning',
        'plan-reminder-start',
        '/plan/calendar',
      ),
      relatedId: Number(event.id),
      notificationDate: this.shortTodayDate,
    };
  }

  startedEventsHandling(userId: number) {
    if (
      this.userService.getPermission(
        this.currentUser.limitations || [],
        Permission.StartOfPlannedRecipeNotify,
      )
    ) {
      return this.planService.getStartedEventsByUserId().pipe(
        switchMap((startedEvents: ICalendarDbEvent[]) => {
          if (startedEvents.length) {
            const reminders$: Observable<any>[] = [];
            startedEvents.forEach((event) => {
              reminders$.push(
                this.notifyService.sendNotification(
                  this.notifyForStartedEvents(event),
                  userId,
                ),
              );
            });
            return forkJoin(reminders$);
          } else {
            return of(null);
          }
        }),
      );
    } else {
      return of(null);
    }
  }

  upcomingEventsHandling(userId: number) {

    if (
      this.userService.getPermission(
        this.currentUser.limitations || [],
        Permission.PlannedRecipesInThreeDays,
      )
    ) {
      return this.planService.getUpcomingEventsByUserId().pipe(
        switchMap((upcomingEvents: ICalendarDbEvent[]) => {
          if (upcomingEvents.length) {
            const reminder = this.notifyForUpcomingEvents(upcomingEvents);
            return this.notifyService.sendNotification(reminder, userId);
          }
          return of(null); // Возвращаем Observable, чтобы поддержать цепочку
        }),
      );
    } else return of(null);
  }

  deleteNotify(notifyId: number) {
    return this.notifyService.deleteNotification(notifyId);
  }

  loading = false;

  openNotifies() {
    if (!this.currentUser.id) {
      this.noAccessModalShow = true;
    } else this.notifiesOpen = true;
    this.popups = [];
    this.cd.markForCheck();
  }

  handleExitModal(answer: boolean) {
    this.exitModalShow = false;

    if (answer) {
      this.loading = true;
      this.authService.logout().subscribe(() => {
        this.router.navigateByUrl('/');
        this.mobileMenuOpen = false;    this.mobileSectionsOpen = [false, false, false];

        this.loading = false;
        this.router.navigateByUrl('/');
        this.authService.setCurrentUser(nullUser);
      });
    }
  }

  popupsInit() {
    if (this.currentUser.id) {
      return this.notifyService
        .getFirstUnreadedNotifications(this.maxNumberOfPopupsInSameTime)
        .pipe(
          tap((response) => {
            const notifications:INotification[] = response.notifications;
            this.notReadedNotifies = response.count;
           
            this.notifiesHistory = [...this.notifiesHistory, ...notifications.map(n=>n.id)]
            this.currentUser.notifications = notifications;
            this.authService.setCurrentUser(this.currentUser);
            this.updateNotifies();
            this.sendDarkModeNotify();
          }),
        );
    } else {
      this.sendDarkModeNotify();

      return of(null);
    }

  
  }

  loadUserpic():Observable<any> {
    if (this.currentUser.id) {
      const avatar = this.currentUser.image;
      if (avatar) {
        return this.userService.downloadUserpic(avatar).pipe(
          tap((blob) => {
            this.avatar = URL.createObjectURL(blob);
          }),
          catchError(() => {
            this.avatar = ''
            return EMPTY
          })
        );
      } else {            this.avatar = '';

        return of(null);
      }
    } else {            this.avatar = '';

      return of(null);
    }
  }

  init = false;

  currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user) => {
      
        if (!this.init) {
          this.authService.getTokenUser().subscribe((tokenUser) => {
            this.currentUser = tokenUser;
            this.authService.loadingSubject.next(true);
            this.init = true;
            this.remindersInit();
          });
        } else {
          if (user.id !== this.currentUser.id) {
                      this.currentUser = user;

            this.popupHistory = [];
            this.popups = [];
            this.authService.loadingSubject.next(true);
            this.remindersInit();
          }
          else {
                      this.currentUser = user;

            if (!this.currentUser.notifications) {
              this.currentUser.notifications = [];
            }
            this.currentUser.notifications.forEach(n => {
              if (!n.read && !this.notifiesHistory.includes(n.id)) {
                this.notReadedNotifies++;
                this.notifiesHistory.push(n.id)
              }
            });
            this.updateNotifies();
          }
        }


        this.cd.markForCheck();
      });
  }


  notifiesHistory: number[] = []; 
  getUserLimitations() {
    return this.userService.getLimitations().pipe(
      tap((limitations) => {
        this.currentUser.limitations = limitations;
      }),
    );
  }

  remindersInit() {
    if (this.currentUser.id) {
      this.planService
        .deleteOldStartedReminders()
        .pipe(
          switchMap(() =>
            this.currentUser.id
              ? this.planService.deleteOldUpcomingReminders()
              : of(null),
          ),

          switchMap(() =>
            this.currentUser.id ? this.getUserLimitations() : of(null),
          ),
          switchMap(() =>
            this.currentUser.id
              ? this.planService
                  .hasUpcomingReminder()
                  .pipe(
                    switchMap((res) =>
                      !res.hasRows
                        ? this.upcomingEventsHandling(this.currentUser.id)
                        : of(null),
                    ),
                  )
              : of(null),
          ),
          switchMap(() =>
            this.currentUser.role !=='user'
              ? this.getManagersActionsCount()
              : of(null),
          ),
          switchMap(() =>
            this.currentUser.id
              ? this.startedEventsHandling(this.currentUser.id)
              : of(null),
          ),
          switchMap(() => this.popupsInit()),
          catchError((error) => {
            this.authService.loadingSubject.next(false);
            this.authService.errorSubject.next(error);
            return error;
          }),
        )
        .subscribe(() => {
          this.authService.loadCurrentUser(this.currentUser);
          this.loadUserpic().subscribe();

          this.cd.markForCheck();
        });
    } else {
      this.authService.loadCurrentUser(nullUser);
    }
  }

  getManagersActionsCount() {
    return this.authService.getManagerActionsCount().pipe(tap(
      (count) => {
        this.adminActionsCount = count;
      }
    ))
  }

  
  markNotifiesAsReaded() {
    this.currentUser.notifications.forEach((notify: INotification) => {
      notify.read = 1;
    });
    this.authService.setCurrentUser(this.currentUser);
  }

  updateNotifies() {
    if (this.currentUser.notifications) {
      const userNotifies = [...this.currentUser.notifications];

      userNotifies.reverse().forEach((notification) => {
        if (
          !notification.read &&
          this.popups.length < this.maxNumberOfPopupsInSameTime &&
          !this.popupHistory.includes(notification.id) &&
          !this.popups.find((p) => p.id === notification.id)
        ) {
          this.popupLifecycle(notification);
        } else if (this.popups.length >= this.maxNumberOfPopupsInSameTime) {
          this.popupHistory.push(notification.id);
        }
      });

      this.cd.markForCheck();
    }
  }

  removePopup(popup: INotification) {
    const index = this.popups.indexOf(popup);
    if (index !== -1) {
      this.popups.splice(index, 1);
    }
  }

  //удаление уведомления
  autoRemovePopup(popup: INotification): void {
    if (this.hovered !== popup.id) {
      this.removePopup(popup);
    }
  }

  hovered = 0;

  popupHover(popup: INotification) {
    this.hovered = popup.id;
  }

  popupBlur(popup: INotification) {
    this.hovered = 0;
    setTimeout(() => {
      this.autoRemovePopup(popup);
      this.cd.markForCheck();
    }, this.popupLifetime * 1000);
  }

  //добавление и автоудаление всплыв уведомления
  popupLifecycle(popup: INotification): void {
    this.popupHistory.push(popup.id);
    this.popups.unshift(popup);
    setTimeout(() => {
      this.autoRemovePopup(popup);
      this.cd.markForCheck();
    }, this.popupLifetime * 1000);
  }

  nightModePopupLifecycle(popup: INotification): void {
    this.popups.unshift(popup);
    setTimeout(() => {
      if (this.hovered !== popup.id) {
        this.removePopup(popup);
      }
      this.cd.markForCheck();
    }, this.popupLifetime * 2000);
  }

  headerHeightChange(): void {
    const element = document.querySelector('.header') as HTMLElement | null;
    const height = element?.offsetHeight;
    this.headerHeight.emit(height);
    this.cd.markForCheck();
  }

  linkClick(link: string): void {
    if (link !== '/greetings' && this.currentUser.id === 0) {
      this.noAccessModalShow = true;
    } else {
      this.router.navigateByUrl(link);
    }
  }

  svgPath(svg: string) {
    return this.baseSvgPath + svg + '.svg';
  }

  isActiveSvgPath(svg: string, activePage: string) {
    return (
      this.baseSvgPath +
      '/header/' +
      svg +
      (this.activePage === activePage ? '-active' : '') +
      '.svg'
    );
  }

  svgActiveClass(activePage: string) {
    return this.activePage === activePage ? 'header-svg active' : 'header-svg';
  }

  handleNoAccessModal(event: boolean): void {
    if (event) {
      this.router.navigateByUrl('/greetings');
          this.removeModalStyle();
    this.mobileMenuOpen = false;
    this.mobileSectionsOpen = [false, false, false];

    }
    this.noAccessModalShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
