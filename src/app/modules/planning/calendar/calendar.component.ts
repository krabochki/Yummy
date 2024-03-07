import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { isSameDay, isSameMonth } from 'date-fns';
import localeRu from '@angular/common/locales/ru';

import { Subject, finalize, takeUntil, tap } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
import { PlanService } from '../services/plan.service';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { nullCalendarEvent } from '../models/plan';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { CalendarService } from '../services/calendar.service';
import { UserService } from '../../user-pages/services/user.service';
import { RecipeCalendarEvent } from '../models/calendar';
import { NotificationService } from '../../user-pages/services/notification.service';
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

  private destroyed$: Subject<void> = new Subject<void>();

  // Конвертация в массив объектов типа CalendarEvent
  recipeEventsToCalendarEvents(): void {
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
    private notifyService: NotificationService,
    private router: Router,
    private planService: PlanService,
    private authService: AuthService,
    private calendarService: CalendarService,
    private cd: ChangeDetectorRef
  ) {
    this.title.setTitle('Календарь рецептов');
    registerLocaleData(localeRu);
  }

  getCalendarEvents() {
    this.authService.getTokenUser().subscribe((user) => {
      this.planService.getEventsByUserId(user.id).subscribe(
        (events) => {
          this.recipeEvents = this.calendarService.translateEvents(events);
          this.events = this.calendarService.translateEvents(events);
          this.refresh.next();
        }
      );
    });
  }

  public ngOnInit(): void {
    this.getCurrentUser();
    this.getCalendarEvents();
  }

  changeEvents(newEvent: RecipeCalendarEvent) {

    const event:RecipeCalendarEvent = {
      ...newEvent,
      start: new Date(newEvent.start),
      end:newEvent.end? new Date(newEvent.end): undefined,
    };
    const findedEvent = this.recipeEvents.find(e => e.id === event.id);

    
    if (findedEvent) {
      const index = this.events.findIndex(e => e.id === event.id);
      this.recipeEvents[index] = event;
    } else {
      this.recipeEvents.push(event);
    }
    
    this.recipeEvents = this.recipeEvents.sort((a,b)=> baseComparator(a.start,b.start)).reverse()
    this.events = this.recipeEvents;
          this.refresh.next();

    this.cd.markForCheck();
  }
  private getCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        this.currentUser = receivedUser;
        this.cd.markForCheck();
      });
  }

  deleteEventClick(recipeEvent: RecipeCalendarEvent) {
    this.targetDeletableEvent = recipeEvent;
    this.deleteModalShow = true;
  }

  handleDeleteModal(answer: boolean) {
    if (answer) {
      this.deleteEvent(this.targetDeletableEvent);
    }
    this.deleteModalShow = false;
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

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent) {
    const recipeEvent = this.findRecipeEvent(Number(event.id));
    const modifiedEvent: RecipeCalendarEvent = {
      ...event,
      recipe: recipeEvent.recipe,
    };
    const before = { ...modifiedEvent };

    const endChanged = before.end?.toString() !== newEnd?.toString();
    const startChanged = before.start.toString() !== newStart.toString();
    if (endChanged || startChanged) {
      this.loading = true;
      this.cd.markForCheck();
      this.planService
        .changeEventDate(modifiedEvent, newStart, newEnd)
        .pipe(
          tap(() => {
            this.recipeEvents = this.recipeEvents.map(
              (e: RecipeCalendarEvent) => {
                return e.id === modifiedEvent.id
                  ? {
                      ...modifiedEvent,
                      start: newStart,
                      end: newEnd,
                    }
                  : e;
              },
            );

            
             const findedEvent = this.recipeEvents.find(
               (e) => e.id === modifiedEvent.id,
             );

             if (findedEvent) {
               const index = this.events.findIndex((e) => e.id === event.id);
               this.recipeEvents[index] = {
                 ...this.recipeEvents[index], start: newStart,
                 end: newEnd,
               };

                   this.recipeEvents = this.recipeEvents
                     .sort((a, b) => baseComparator(a.start, b.start))
                     .reverse();


               this.events = this.recipeEvents;
               this.refresh.next();
            }
            
          }),
          finalize(() => {
            this.loading = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
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
  loading = false;

  deleteEvent(eventToDelete: RecipeCalendarEvent) {
    this.loading = true;
    this.cd.markForCheck();

    if (eventToDelete.id)
      this.planService
        .deleteEvent(Number(eventToDelete.id))
        .pipe(
          tap(() => {
            this.recipeEvents = this.recipeEvents.filter(
              (event: RecipeCalendarEvent) => event.id != eventToDelete.id,
            );
            this.events = this.recipeEvents;
            this.refresh.next();
            this.currentUser.notifications = this.currentUser.notifications.filter(n =>
              !(n.relatedId === eventToDelete.id && n.context === 'plan-reminder-start'));
            this.authService.setCurrentUser(this.currentUser);
          }),
          finalize(() => {
            this.loading = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    this.loading = false;
    this.cd.markForCheck();
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
