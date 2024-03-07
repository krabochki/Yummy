import { ShoppingListItem } from './shopping-list';
import { RecipeCalendarEvent } from './calendar';


export const nullCalendarEvent: RecipeCalendarEvent = {
  id: 0,
  resizable: { beforeStart: true, afterEnd: true },
  draggable:true,
  recipe: 0,
  start: new Date(-8640000000000000),
  title: '',
};
