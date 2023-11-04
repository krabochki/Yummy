import { CalendarEvent } from 'angular-calendar';
import { ShoppingListItem } from './shopping-list';

export interface IPlan {
  id: number;
  user: number;
  shoppingList: ShoppingListItem[];
  calendarEvents: CalendarEvent[];
}


export const nullCalendarEvent: CalendarEvent = {
  id: 0,
  recipeId: 0,
  start: new Date(-8640000000000000),
  title:''
}
  

export const nullPlan: IPlan = {
  id: 0,
  user: 0,
  shoppingList: [],
  calendarEvents: [],
};
