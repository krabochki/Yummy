/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { INotification, nullNotification } from '../models/notifications';
import { getCurrentDate } from 'src/tools/common';
import { IUser, nullUser } from '../models/users';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../authentication/services/auth.service';
import { notificationsSource } from '../../../../tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifyUrl: string = notificationsSource;
  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  currentUser: IUser = nullUser;

  buildNotification(
    title: string,
    text: string,
    type: 'info' | 'warning' | 'error' | 'success' | 'night-mode',
    context:
      | 'category'
      | 'recipe'
      | 'manager'
      | 'update'
      | 'without'
      | 'comment'
      | 'hire'
      | 'born'
      | 'user'
      | 'calendar-recipe'
      | 'ingredient'
      | 'update'
  |'star'
      | 'demote'
      | 'plan-reminder'
      | 'plan-reminder-start',
    link: string,
  ): INotification {
    const notification: INotification = {
      ...nullNotification,
      title: title,
      link: link,
      context: context,
      message: text,
      type: type,
      sendDate: getCurrentDate(),
    };
    return notification;
  }

  clearAll() {
     const options = { withCredentials: true };

    const url = `${this.notifyUrl}`;
    return this.http.delete(url, options);
  }
  markNotificationsAsRead() {
    const options = { withCredentials: true };
    const url = `${this.notifyUrl}/mark-read`;
    return this.http.put(url, {}, options);
  }

  getSomeNotifications(
    offset: number,
    limit: number,
  ): Observable<any> {
         const options = { withCredentials: true };

    return this.http.get<any>(
      `${this.notifyUrl}/some?offset=${offset}&limit=${limit}`,
    options);
  }

  getFirstUnreadedNotifications(
  ): Observable<any> {
             const options = { withCredentials: true };

    return this.http.get<any>(
      `${this.notifyUrl}/unreaded`,options
    );
  }

  markNotificationAsRead(notificationId: number) {
    const options = { withCredentials: true };
    const url = `${this.notifyUrl}/notifications/${notificationId}/mark-read`;
    return this.http.put(url, {}, options);
  }

  deleteNotification(notificationId: number) {
        const options = { withCredentials: true };

    const url = `${this.notifyUrl}/notifications/${notificationId}`;
    return this.http.delete(url,options);
  }


  sendNotification(
    notification: INotification,
    userId: number,
    forMe?: boolean,
  ) {                const options = { withCredentials: true };

    const sendNotification: INotification = {
      ...notification,
      userId: userId,
    };
    return this.http.post<INotification>(this.notifyUrl, sendNotification, options).pipe(
      tap((response) => {
        sendNotification.id = response.id;
        if (forMe) {
          this.currentUser.notifications.push(sendNotification);
          this.authService.setCurrentUser(this.currentUser);
        }
      }),
    );
  }
}
