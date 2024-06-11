import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ShoppingListItem } from '../models/shopping-list';
import { ICalendarDbEvent, RecipeCalendarEvent } from '../models/calendar';
import { plansSource } from 'src/tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  planUrl = plansSource;

  constructor(private http: HttpClient) {}

  getProductsByUserId(): Observable<ShoppingListItem[]> {
        const options = { withCredentials: true };

    const url = `${this.planUrl}/products`;
    return this.http.get<ShoppingListItem[]>(url,options);
  }

  getRelatedIngredientsForProducts() {
            const options = { withCredentials: true };

    const url = `${this.planUrl}/related-ingredients`;
    return this.http.get<{ ingredientId: number; productId: number }[]>(
      url,
      options,
    );
  }
  getRelatedIngredientsForProduct(productId: number) {
                const options = { withCredentials: true };

    const url = `${this.planUrl}/related-ingredients-by-product/${productId}`;
    return this.http.get<{ ingredientId: number; productId: number }[]>(url, options);
  }

  getEventsByUserId(): Observable<ICalendarDbEvent[]> {
                    const options = { withCredentials: true };

    const url = `${this.planUrl}/events`;
    return this.http.get<ICalendarDbEvent[]>(url, options);
  }

  getUpcomingEventsByUserId(): Observable<ICalendarDbEvent[]> {
                        const options = { withCredentials: true };

    const url = `${this.planUrl}/upcoming-events`;
    return this.http.get<ICalendarDbEvent[]>(url, options);
  }



getStartedEventsByUserId(): Observable < ICalendarDbEvent[] > {
                            const options = { withCredentials: true };

    const url = `${this.planUrl}/started-events`;
    return this.http.get<ICalendarDbEvent[]>(url, options);
  }
  deleteOldUpcomingReminders() {
                                const options = { withCredentials: true };

    const url = `${this.planUrl}/old-upcoming-reminders`;
    return this.http.delete(url, options);
  }
  deleteOldStartedReminders() {                            const options = { withCredentials: true };

    const url = `${this.planUrl}/old-started-reminders`;
    return this.http.delete(url, options);
  }

  hasUpcomingReminder() {
                                const options = { withCredentials: true };

    const url = `${this.planUrl}/today-upcoming-reminder`;
    return this.http.get<{ hasRows: boolean }>(url, options);
  }

  markProductAsBought(product: ShoppingListItem) {
                                const options = { withCredentials: true };

    const url = `${this.planUrl}/products/${product.id}/mark-bought`;
    return this.http.put(url, { bought: product.bought },options);
  }

  updateEvent(event: ICalendarDbEvent) {
                                const options = { withCredentials: true };

    return this.http.put(`${this.planUrl}/events/${event.id}`, event,options);
  }

  changeEventDate(event: RecipeCalendarEvent, start: Date, end?: Date) {
      const options = { withCredentials: true };

    const url = `${this.planUrl}/events/${event.id}/change-date`;
    return this.http.put(url, { start: start, end: end }, options);
  }

  deleteProduct(productId: number) {
    const options = { withCredentials: true };
    const url = `${this.planUrl}/products/${productId}`;
    return this.http.delete(url, options);
  }

  deleteEvent(eventId: number) {
    const options = { withCredentials: true };
    const url = `${this.planUrl}/events/${eventId}`;
    return this.http.delete(url,options);
  }

  updateProductType(productId: number, typeId: number) {
        const options = { withCredentials: true };

    const url = `${this.planUrl}/products/${productId}/update-type`;
    return this.http.put(url, { typeId }, options);
  }

  deleteAllProductsForUser() {
            const options = { withCredentials: true };

    const url = `${this.planUrl}/products/user`;
    return this.http.delete(url,options);
  }

  postProduct(newProduct: ShoppingListItem) {
                const options = { withCredentials: true };

    const url = `${this.planUrl}/products`;
    return this.http.post(url, newProduct, options);
  }

  postEvent(newEvent: ICalendarDbEvent) {
                    const options = { withCredentials: true };

    const url = `${this.planUrl}/events`;
    return this.http.post(url, newEvent, options);
  }
}
