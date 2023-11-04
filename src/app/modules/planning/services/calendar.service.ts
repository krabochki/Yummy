import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent } from 'angular-calendar';
import { EventColor } from 'calendar-utils';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(private http: HttpClient) {}

  createCalendarEvent(
    recipeId: number,
    start: Date,
    title: string,
    color: string,
  ): CalendarEvent {
    const eventColor: EventColor = { primary: color, secondary: color };
    return {
      id:0,
      recipeId,
      start,
      title,
      color: eventColor,
      allDay: true,
      draggable: true,

      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
    };
  }
}
