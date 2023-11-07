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
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { count, modal, notifies } from 'src/tools/animations';
import { IPlan, nullPlan } from 'src/app/modules/planning/models/plan';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
import { CalendarService } from 'src/app/modules/planning/services/calendar.service';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { TimePastService } from 'ng-time-past-pipe';
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
  planSelectItems = planSelectItems;
  planRouterLinks = planRouterLinks;

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
    private notifyService: NotificationService,
    private router: Router,
    private timePastService: TimePastService,
    private calendarService: CalendarService,
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
    return userRoutes(this.currentUser.id);
  }
  get planRoutes() {
    return planRoutes(this.currentUser.id);
  }

  get notificationCount() {
    if (this.currentUser.notifications)
      return this.currentUser.notifications.filter((n) => n.read === false)
        .length;
    else return 0;
  }

  private currentUserPlan: IPlan = nullPlan;

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

  planRemindersInit(plan: IPlan) {

    let editUser = false;

    const today = new Date();
    const todayDay = today.getDate();

    const result = new Date();
    result.setDate(todayDay + 3); //текущая дата + следующие три дня
    const eventsInFuture = plan.calendarEvents.filter((event) => {
      return this.calendarService.eventInFuture(event);
    }); //получаем все события в будущем
    const eventsIn3Days = eventsInFuture.filter(
      (e) => new Date(e.start) < result,
    ); //получаем события в будущем только в следующие 3 дня

    const currentEvents = plan.calendarEvents.filter((event) => {
      return this.calendarService.eventIsNow(event); //события которые прошли
    });
    if (currentEvents.length > 0) {
      const shortTodayDate = today.toDateString(); //сегодняшняя дата без часов

      currentEvents.forEach((event) => {
        const currentUserNotifications = this.currentUser.notifications;
        let alreadySentReminder = false; //прислано ли уже уведомление

        currentUserNotifications.forEach((notify) => {
          if (
            notify.context === 'plan-reminder-start' &&
            notify.relatedId === event.id
          )
            alreadySentReminder = true; //если уже есть уведомление с типом напоминалка и прислано оно сегодня
        });
        if (!alreadySentReminder) {
          const reminder = {
            ...this.notifyService.buildNotification(
              'Время начала запланированного рецепта настало!',
              'Время начала запланированного вами рецепта «' +
                event.title +
                '» уже настало! Не забудьте проверить список ингредиентов и начните готовить это вкусное блюдо. Удачи!',
              'warning',
              'plan-reminder-start',
              '/plan/calendar',
            ),
            relatedId: event.id,
            notificationDate: shortTodayDate,
          };
         this.notifyService
           .sendNotification(reminder, this.currentUser)
           .subscribe();
        }
      });
    }

   

    
    if (eventsIn3Days.length > 0) {
      //если че то есть :
      const shortTodayDate = today.toDateString(); //сегодняшняя дата без часов
      let alreadySentReminder = false; //прислано ли уже уведомление
      const currentUserNotifications = this.currentUser.notifications;
      currentUserNotifications.forEach((notify) => {
        if (
          notify.context === 'plan-reminder' &&
          notify.notificationDate === shortTodayDate
        )
          alreadySentReminder = true; //если уже есть уведомление с типом напоминалка и прислано оно сегодня
      });

      //очищаем старые напоминалки

      

      if (!alreadySentReminder) {
        //если сегодня не напоминали
        

        if (this.currentUser.notifications.length !== this.currentUser.notifications.filter(n => n.context !== 'plan-reminder').length)
          editUser=true
        this.currentUser.notifications = this.currentUser.notifications.filter(
          (n) => n.context !== 'plan-reminder',
        );

        let counter = 0;
        const eventTitles = eventsIn3Days.map((event) => {
          counter++;
          const when = ` (начало ${this.timePastService
            .timePast(event.start)
            .toLowerCase()})`;
          return (
            'ㅤ' +
            (eventsIn3Days.length > 1 ? counter + ') ' : '') +
            event.title.trim() +
            when
          );
        });
        const eventString = eventTitles.join(', <br>');
        const reminderText = `Хотим вас предупредить, что у вас запланирован${
          eventsIn3Days.length > 1 ? 'ы' : ''
        } рецепт${
          eventsIn3Days.length > 1 ? 'ы' : ''
        } на ближайшее время. Не забудьте проверить список ингредиентов и подготовьтесь к приготовлению ${
          eventsIn3Days.length > 1
            ? 'этих вкусных блюд'
            : 'этого вкусного блюда'
        }.<br>Запланированны${eventsIn3Days.length > 1 ? 'е' : 'й'} рецепт${
          eventsIn3Days.length > 1 ? 'ы' : ''
        }:<br>${eventString}`;

        const reminder = {
          ...this.notifyService.buildNotification(
            'Начало запланированного рецепта уже скоро!',
            reminderText,
            'warning',
            'plan-reminder',
            '/plan/calendar',
          ),
          notificationDate: shortTodayDate,
        };

        //присылаем увед
        this.notifyService
          .sendNotification(reminder, this.currentUser)
          .subscribe();
      }

    }

    
    //очищаем напоминания о начале событий которые уже прошли
      this.currentUser.notifications.forEach((n) => {
        if (n.context === 'plan-reminder-start') {
          const findedEvent = this.currentUserPlan.calendarEvents.find(
            (e) => e.recipe === n.relatedId,
          );
          if (findedEvent) {
            if (
              (findedEvent.end && today > findedEvent.end) ||
              (!findedEvent.end &&
                today.getDate() !== findedEvent.start.getDate())
            ) {
              editUser = true;
              this.currentUser.notifications =
                this.currentUser.notifications.filter(
                  (n) =>
                    n.context !== 'plan-reminder-start' &&
                    n.relatedId !== findedEvent.recipe,
                );
            }
          }
        }
      });
    
  
    if(editUser)
    this.userService.updateUser(this.currentUser).subscribe();

  }

  currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser) => {
        if (receivedUser.id !== 0) {
          const findUser = this.users.find((u) => u.id === receivedUser.id);
          if (findUser) {
            this.cookRouterLinks[0] = '/cooks/list/' + this.currentUser.id;
            this.currentUser = findUser;
            this.notifies = [];
            this.updateNotifies();
          }
        } else this.currentUser = receivedUser;

        if (this.currentUser.id > 0)
          this.planService.plans$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((receivedPlans: IPlan[]) => {
              this.currentUserPlan = this.planService.getPlanByUser(
                this.currentUser.id,
                receivedPlans,
              );

              if (this.currentUserPlan.id > 0)
                this.planRemindersInit(this.currentUserPlan);
            });
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
    console.log(this.notifies);
    this.notifies.forEach((notification) => {
      if (notification.read === false) {
        haveNotRead = true;
      }
      notification.read = true;
    });
    console.log(this.notifies);

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
    }
    this.noAccessModalShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
