import { ShoppingListItem } from './shopping-list';
import { RecipeCalendarEvent } from './calendar';

export interface IPlan {
  id: number;
  user: number;
  shoppingList: ShoppingListItem[];
  calendarEvents: RecipeCalendarEvent[];
}


export const nullCalendarEvent: RecipeCalendarEvent = {
  id: 0,
  recipe: 0,
  start: new Date(-8640000000000000),
  title: '',
};
  

export const nullPlan: IPlan = {
  id: 0,
  user: 0,
  shoppingList: [],
  calendarEvents: [],
};
