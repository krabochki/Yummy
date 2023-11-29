import { CalendarEvent } from "angular-calendar"

export interface RecipeCalendarEvent<MetaType = any> extends CalendarEvent<MetaType> {
    recipe: number;
}
