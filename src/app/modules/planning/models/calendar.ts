import { CalendarEvent } from "angular-calendar"

export interface RecipeCalendarEvent<MetaType = any> extends CalendarEvent<MetaType> {
    recipe: number;
}

export interface ICalendarDbEvent {
  id: number;
  end?: Date;
  start: Date;
  color: string;
  title: string;
  recipeId?: number;
  wholeDay: 0 | 1;
  userId?: number;
}

export const nullDbEvent:ICalendarDbEvent = {
    id: 0,
    start: new Date(-1000000),
    color: '',
    title: '',
    wholeDay:0
}