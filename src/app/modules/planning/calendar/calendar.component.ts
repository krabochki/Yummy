import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { endOfDay, isSameDay, isSameMonth } from 'date-fns';
import localeRu from '@angular/common/locales/ru';

import { Observable, Subject, forkJoin, take, takeUntil } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
import { PlanService } from '../services/plan-service';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IPlan, nullCalendarEvent, nullPlan } from '../models/plan';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { CalendarService } from '../services/calendar.service';
import { UserService } from '../../user-pages/services/user.service';
import { RecipeCalendarEvent } from '../models/calendar';
import { baseComparator } from 'src/tools/common';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit, OnDestroy {
  protected showInfo: boolean = false; //открыто ли "подробнее"

  //переменные для работы календаря
  protected view: CalendarView = CalendarView.Month; //начальный вид календаря
  protected CalendarView: typeof CalendarView = CalendarView;
  protected viewDate: Date = new Date();
  protected refresh: Subject<void> = new Subject<void>();
  protected activeDayIsOpen: boolean = true;

  protected targetEvent: RecipeCalendarEvent = nullCalendarEvent; //какой event посылаем менять
  protected locale: string = 'ru';

  deleteModalShow = false;

  targetDeletableEvent = nullCalendarEvent;

  protected createMode = false; //открыто ли создание/изменение календарного события

  recipeEvents: RecipeCalendarEvent[] = [];
  events: CalendarEvent[] = [];
  protected currentUser: IUser = { ...nullUser };
  protected currentUserPlan: IPlan = nullPlan; //план текущего юзера

  private destroyed$: Subject<void> = new Subject<void>();

  // Конвертация в массив объектов типа CalendarEvent
  recipeEventsToCalendarEvents():void {
    const originalEvents: CalendarEvent[] = this.recipeEvents.map(
      (recipeEvent) => {
        const originalEvent = { ...recipeEvent };
        return originalEvent;
      },
    );
    this.events = originalEvents;
  }

  constructor(
    private title: Title,
    private router: Router,
    private planService: PlanService,
    private authService: AuthService,
    private calendarService: CalendarService,
    private cd: ChangeDetectorRef,
    private userService: UserService,
  ) {
    this.title.setTitle('План рецептов');
    registerLocaleData(localeRu);
  }

  public ngOnInit(): void {
    this.getCurrentUser();
    this.getPlans();
  }

  private getCurrentUser(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers: IUser[]) => {
        this.authService.currentUser$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((receivedUser: IUser) => {
            const actualUser = receivedUsers.find(
              (u) => u.id === receivedUser.id,
            );
            this.currentUser = actualUser ? actualUser : nullUser;
          });
      });
  }

  deleteEventClick(recipeEvent: RecipeCalendarEvent) {
    this.targetDeletableEvent = recipeEvent;
    this.deleteModalShow = true;
  }

  handleDeleteModal(answer: boolean) {
    if(answer){
      this.deleteEvent(this.targetDeletableEvent);
    }
    this.deleteModalShow = false; 
  }

  private getPlans(): void {
    this.planService.plans$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedPlans: IPlan[]) => {
        this.currentUserPlan = this.planService.getPlanByUser(
          this.currentUser.id,
          receivedPlans,
        );
        this.recipeEvents = this.sortEvents(
          this.currentUserPlan.calendarEvents,
        );
        this.recipeEventsToCalendarEvents()
        this.refresh.next();
        this.cd.markForCheck();
      });
  }

  sortEvents(events: RecipeCalendarEvent[]) {
    const buferEvents = this.getEventsWithNormalData(events);
    return buferEvents.sort((e1, e2) => {
      return new Date(e1.start) > new Date(e2.start)
        ? 1
        : new Date(e1.start) === new Date(e2.start)
        ? Number(e1.id) < Number(e2.id)
          ? 1
          : -1
        : -1;
    });
  }

  private getEventsWithNormalData(
    events: RecipeCalendarEvent[],
  ): RecipeCalendarEvent[] {
    const eventsWithModifyNormalData = events;
    //дата извлекается из обьекта после запроса не в корректном формате даты
    //календарь не может ее преобразовать, поэтому преобразовываю тут
    eventsWithModifyNormalData.forEach((event) => {
      event.start = new Date(event.start);
      if (event.end) event.end = new Date(event.end);
    });
    return eventsWithModifyNormalData;
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  findRecipeEvent(id: any) {
    id = Number(id);
    return this.recipeEvents.find((e) => e.id === id) || nullCalendarEvent;
  }

  protected eventTimesChanged({
    //перетаскивание события и изменение его даты
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    const recipeEvent = this.findRecipeEvent(Number(event.id));
    const modifiedEvent: RecipeCalendarEvent = {
      ...event,
      recipe: recipeEvent.recipe,
    };
    const before = { ...modifiedEvent };
    this.recipeEvents = this.recipeEvents.map((e: RecipeCalendarEvent) => {
      return e.id === modifiedEvent.id
        ? {
            ...modifiedEvent,
            start: newStart,
            end: newEnd,
          }
        : e;
    });

    const endChanged = before.end?.toString() !== newEnd?.toString();
    const startChanged = before.start.toString() !== newStart.toString();
    if (endChanged || startChanged) {
      this.currentUserPlan.calendarEvents = this.recipeEvents;
      this.recipeEventsToCalendarEvents()
      this.planService.updatePlan(this.currentUserPlan).subscribe();
    }
  }

  eventIsNow(event: RecipeCalendarEvent): boolean {
    return this.calendarService.eventIsNow(event);
  }

  eventInFuture(event: RecipeCalendarEvent): boolean {
    return this.calendarService.eventInFuture(event);
  }

  eventInPast(event: RecipeCalendarEvent): boolean {
    return this.calendarService.eventInPast(event);
  }
  handleEvent(action: string, event: CalendarEvent): void {
    if (action === 'Clicked') {
      if (this.findRecipeEvent(event.id).recipe)
        this.router.navigateByUrl(
          '/recipes/list/' + this.findRecipeEvent(event.id).recipe,
        );
      return;
    }
  }

  deleteEvent(eventToDelete: RecipeCalendarEvent) {
    this.recipeEvents = this.recipeEvents.filter(
      (event: RecipeCalendarEvent) => event !== eventToDelete,
    );
    const reminderNotify = this.currentUser.notifications.find(
      (n) => n.relatedId === eventToDelete.id,
    );
    if (reminderNotify)
      this.currentUser.notifications = this.currentUser.notifications.filter(
        (n) => n.id !== reminderNotify.id,
      );
    this.currentUserPlan.calendarEvents = this.recipeEvents;
    const subscribes:Observable<any>[] = [];
    subscribes.push(this.userService.updateUser(this.currentUser))
    subscribes.push(this.planService.updatePlan(this.currentUserPlan));
    forkJoin(subscribes).subscribe();
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  closeCreateModal() {
    this.createMode = false;
    this.targetEvent = nullCalendarEvent;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
