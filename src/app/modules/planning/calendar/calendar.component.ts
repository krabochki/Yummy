import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { isSameDay, isSameMonth } from 'date-fns';
import localeRu from '@angular/common/locales/ru';

import { Subject, takeUntil } from 'rxjs';
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

  protected targetEvent: CalendarEvent = nullCalendarEvent; //какой event посылаем менять
  protected locale: string = 'ru';

  protected createMode = false; //открыто ли создание/изменение календарного события

  protected events: CalendarEvent[] = []; //список календарных событий юзера
  protected currentUser: IUser = nullUser;
  protected currentUserPlan: IPlan = nullPlan; //план текущего юзера

  private destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private title: Title,
    private router: Router,
    private planService: PlanService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) {
    this.title.setTitle('План рецептов');
    registerLocaleData(localeRu);
  }

  public ngOnInit(): void {
    this.getCurrentUser();
    this.getPlans();
  }

  private getCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        this.currentUser = receivedUser;
      });
  }

  private getPlans(): void {
    this.planService.plans$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedPlans: IPlan[]) => {
        this.currentUserPlan = this.planService.getPlanByUser(
          this.currentUser.id,
          receivedPlans,
        );
        this.events = this.getEventsWithNormalData();
        this.events = this.events.sort((e1, e2) => {
          {
            if (e1.start > e2.start) return 1;
            else return -1;
          }
        }); //сортируем по времени(прошедшие раньше)
        this.cd.markForCheck();
        this.refresh.next();
      });
  }

  private getEventsWithNormalData(): CalendarEvent[] {
    const eventsWithModifyNormalData = this.currentUserPlan.calendarEvents;
    //дата извлекается из обьекта после запроса не в корректном формате даты
    //календарь не может ее преобразовать, поэтому преобразовываю тут
    eventsWithModifyNormalData.forEach((event) => {
      event.start = new Date(event.start);
      if (event.end) event.end = new Date(event.end);
    });
    return eventsWithModifyNormalData;
  }

  protected dayClicked({
    date,
    events,
  }: {
    date: Date;
    events: CalendarEvent[];
  }): void {
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

  protected eventTimesChanged({
    //перетаскивание события и изменение его даты
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    const before = { ...event };
    this.events = this.events.map((iEvent: CalendarEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });

    const endChanged = before.end?.toString() !== newEnd?.toString();
    const startChanged = before.start.toString() !== newStart.toString();

    if (endChanged || startChanged) {
      this.currentUserPlan.calendarEvents = this.events;
      this.planService.updatePlan(this.currentUserPlan).subscribe();
      this.handleEvent('Dropped or resized', event);
    }
  }

  handleEvent(action: string, event: CalendarEvent): void {
    if (action === 'Clicked') {
      if (event.recipeId !== 0)
        this.router.navigateByUrl('/recipes/list/' + event.recipeId);
      return;
    }
    if (action === 'Dropped or resized') return;
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter(
      (event: CalendarEvent) => event !== eventToDelete,
    );
    this.currentUserPlan.calendarEvents = this.events;
    this.planService.updatePlan(this.currentUserPlan).subscribe();
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
