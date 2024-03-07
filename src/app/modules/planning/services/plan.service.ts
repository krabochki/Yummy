import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ShoppingListItem } from '../models/shopping-list';
import { ICalendarDbEvent, RecipeCalendarEvent } from '../models/calendar';

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  planUrl = 'http://localhost:3000/plans';

  constructor(private http: HttpClient) {}

  getProductsByUserId(userId: number): Observable<ShoppingListItem[]> {
    const url = `${this.planUrl}/products/${userId}`;
    return this.http.get<ShoppingListItem[]>(url);
  }

  getRelatedIngredientsForProducts(userId: number) {
    const url = `${this.planUrl}/related-ingredients/${userId}`;
    return this.http.get<{ ingredientId: number; productId: number }[]>(url);
  }
  getRelatedIngredientsForProduct(productId: number) {
    const url = `${this.planUrl}/related-ingredients-by-product/${productId}`;
    return this.http.get<{ ingredientId: number; productId: number }[]>(url);
  }

  getEventsByUserId(userId: number): Observable<ICalendarDbEvent[]> {
    const url = `${this.planUrl}/events/${userId}`;
    return this.http.get<ICalendarDbEvent[]>(url);
  }

  getUpcomingEventsByUserId(userId: number): Observable<ICalendarDbEvent[]> {
    const url = `${this.planUrl}/upcoming-events/${userId}`;
    return this.http.get<ICalendarDbEvent[]>(url);
  }

  getStartedEventsByUserId(userId: number): Observable<ICalendarDbEvent[]> {
    const url = `${this.planUrl}/started-events/${userId}`;
    return this.http.get<ICalendarDbEvent[]>(url);
  }
  deleteOldUpcomingReminders(userId: number) {
    const url = `${this.planUrl}/old-upcoming-reminders/${userId}`;
    return this.http.delete(url);
  }
  deleteOldStartedReminders(userId: number) {
    const url = `${this.planUrl}/old-started-reminders/${userId}`;
    return this.http.delete(url);
  }

  hasUpcomingReminder(userId: number) {
    const url = `${this.planUrl}/today-upcoming-reminder/${userId}`;
    return this.http.get<{ hasRows: boolean }>(url);
  }

  markProductAsBought(product: ShoppingListItem) {
    const url = `${this.planUrl}/products/${product.id}/mark-bought`;
    return this.http.put(url, { bought: product.bought });
  }

  updateEvent(event: ICalendarDbEvent) {
    return this.http.put(`${this.planUrl}/events/${event.id}`, event);
  }

  changeEventDate(event: RecipeCalendarEvent, start: Date, end?: Date) {
    const url = `${this.planUrl}/events/${event.id}/change-date`;
    return this.http.put(url, { start: start, end: end });
  }

  deleteProduct(productId: number) {
    const url = `${this.planUrl}/products/${productId}`;
    return this.http.delete(url);
  }

  deleteEvent(eventId: number) {
    const url = `${this.planUrl}/events/${eventId}`;
    return this.http.delete(url);
  }

  updateProductType(productId: number, typeId: number) {
    const url = `${this.planUrl}/products/${productId}/update-type`;
    return this.http.put(url, { typeId });
  }

  deleteAllProductsForUser(userId: number) {
    const url = `${this.planUrl}/products/user/${userId}`;
    return this.http.delete(url);
  }

  postProduct(newProduct: ShoppingListItem) {
    const url = `${this.planUrl}/products`;
    return this.http.post(url, newProduct);
  }

  postEvent(newEvent: ICalendarDbEvent) {
    const url = `${this.planUrl}/events`;
    return this.http.post(url, newEvent);
  }
}
