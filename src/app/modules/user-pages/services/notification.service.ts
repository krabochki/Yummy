import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { INotification, nullNotification } from '../models/notifications';
import { getCurrentDate } from 'src/tools/common';
import { IUser, nullUser } from '../models/users';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../authentication/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifyUrl: string = 'http://localhost:3000/notifications';
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private http: HttpClient,
  ) {
    this.userService.users$.subscribe((data) => (this.users = data));
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  users: IUser[] = [];
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

  clearAll(user: IUser) {
    const url = `${this.notifyUrl}/${user.id}`;
    return this.http.delete(url);
  }
  markNotificationsAsRead(userId: number) {
    const url = `${this.notifyUrl}/${userId}/mark-read`;
    return this.http.put(url, {});
  }

  getSomeNotifications(
    userId: number,
    offset: number,
    limit: number,
  ): Observable<any> {
    return this.http.get<any>(
      `${this.notifyUrl}/some/${userId}?offset=${offset}&limit=${limit}`,
    );
  }

  getFirstUnreadedNotifications(
    userId: number,
  ): Observable<any> {
    return this.http.get<any>(
      `${this.notifyUrl}/unreaded/${userId}`,
    );
  }

  markNotificationAsRead(notificationId: number) {
    const url = `${this.notifyUrl}/notifications/${notificationId}/mark-read`;
    return this.http.put(url, {});
  }

  deleteNotification(notificationId: number) {
    const url = `${this.notifyUrl}/notifications/${notificationId}`;
    return this.http.delete(url);
  }

  addNotificationToUser(notify: INotification, user: IUser) {
    const actualUser = this.users.find((u) => u.id === user.id);
    if (actualUser) {
      if (!actualUser.notifications) {
        actualUser.notifications = [];
      }
      let maxId = 0;
      if (actualUser.notifications.length > 0)
        maxId = Math.max(...actualUser.notifications.map((n) => n.id));
      notify.id = maxId + 1;
      actualUser.notifications.push(notify);
      return actualUser;
    }
    return user;
  }
  sendNotification(
    notification: INotification,
    userId: number,
    forMe?: boolean,
  ) {
    const sendNotification: INotification = {
      ...notification,
      userId: userId,
    };
    return this.http.post<INotification>(this.notifyUrl, sendNotification).pipe(
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
