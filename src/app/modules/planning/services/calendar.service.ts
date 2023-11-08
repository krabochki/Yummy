import { Injectable } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { EventColor } from 'calendar-utils';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {

  createCalendarEvent(
    recipe: number,
    start: Date,
    title: string,
    color: string,
    end?: Date,
  ): CalendarEvent {
    const eventColor: EventColor = { primary: color, secondary: color };
    return {
      id: 0,
      recipe,
      start,
      title,
      color: eventColor,
      allDay: end ? false : true, //если нет конца то событие идет целый день, если нет то нет
      draggable: true,
      end: end,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
    };
  }

  eventIsNow(event: CalendarEvent): boolean {
    const now = new Date();
    const start = new Date(event.start);

    if (!event.end) {
      if (now > start) {
        if (now.getDate() === start.getDate()) {
          return true;
        }
      }
    } else if (event.end) {
      const end = new Date(event.end);
      if (now < start) return false;
      if (now > start && now < end) return true;
    }
    return false;
  }

  eventInPast(event: CalendarEvent): boolean {
    const now = new Date();
    if (!event.end) {
      if (now > event.start) {
        if (now.getDate() > event.start.getDate()) return true;
      }
    } else if (event.end) {
      if (now > event.start && now > event.end) return true;
    }
    return false;
  }

  getEventByRelatedRecipe(events: CalendarEvent[], recipeId: number): CalendarEvent[] {
    return events.filter((event) => event.recipe === recipeId);
  }

  filterEventsByRecipe(events: CalendarEvent[], recipeId: number): CalendarEvent[] {
    return events.filter((event) => event.recipe !== recipeId)
  }

  eventInFuture(event: CalendarEvent): boolean {
    const now = new Date();
    const start = new Date(event.start);
    if (!event.end) {
      if (now < start) {
        if (now.getDate() < start.getDate()) return true;
      }
    } else if (event.end) {
      const end = new Date(event.end);

      if  (now < start && now < end) return true;
    }
    return false;
  }
}
