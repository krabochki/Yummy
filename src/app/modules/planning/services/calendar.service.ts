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
    end?: Date,
  ): CalendarEvent {
    const eventColor: EventColor = { primary: color, secondary: color };
    return {
      id: 0,
      recipeId,
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
        //if (now.getDate() > event.start.getDate()) return false; //дата начала события не сегодняшний день. конец не установлен. считаем что событие длилось весь свой день. возвращаем что прошло
        if (now.getDate() === start.getDate()) {
          return true; //событие началось сегодня, но еще не закончилось, так как длится весь день
        }
        //return false;
      } //else return false;
    } else if (event.end) {
      const end = new Date(event.end);

      if (now < start) return false; //событие еще не началось
      if (now > start && now < end) return true; //событие началось но не закончилось
      //if ((now > event.start) && (now > event.end)) return false; //событие и началось, и закончилось
      //return false;
    }
    return false;
  }

  eventInPast(event: CalendarEvent): boolean {
    const now = new Date();
    if (!event.end) {
      if (now > event.start) {
        if (now.getDate() > event.start.getDate()) return true; //дата начала события не сегодняшний день. конец не установлен. считаем что событие длилось весь свой день. возвращаем что прошло
        //  if (now.getDate() === event.start.getDate()) {
        //    return false; //событие началось сегодня, но еще не закончилось, так как длится весь день
        //  }
        //        return false;
      }
      // else return false;
    } else if (event.end) {
      // if (now < event.start) return false;
      //  if ((now > event.start) && (now < event.end)) return false //событие началось но не закончилось
      if (now > event.start && now > event.end) return true; //событие и началось, и закончилось
      // return false;
    }
    return false;
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

      if (now < start && now < end) return true;
    }
    return false;
  }
}
