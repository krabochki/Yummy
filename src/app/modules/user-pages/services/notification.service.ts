import { Injectable } from '@angular/core';
import { AuthService } from '../../authentication/services/auth.service';
import { UserService } from './user.service';
import { INotification, nullNotification } from '../models/notifications';
import { getCurrentDate } from 'src/tools/common';
import { IUser } from '../models/users';
import { EMPTY } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {
    this.userService.users$.subscribe((data) => (this.users = data));
  }

  users: IUser[] = [];

  buildNotification(
    title: string,
    text: string,
    type: 'info' | 'warning' | 'error' | 'success',
    context:
      | 'category'
      | 'recipe'
      | 'without'
      | 'comment'
      | 'user'
      | 'plan-reminder'
      | 'plan-reminder-start',
    link: string,
  ): INotification {
    const notification: INotification = {
      ...nullNotification,
      title: title,
      relatedLink: link,
      context: context,
      message: text,
      type: type,
      timestamp: getCurrentDate(),
    };
    return notification;
  }

  sendNotification(notification: INotification, user: IUser) {
    const actualUser = this.users.find((u) => u.id === user.id);

    if (actualUser) {
      if (!actualUser.notifications) {
        actualUser.notifications = [];
      }
      let maxId = 0;
      if (actualUser.notifications.length > 0)
        maxId = Math.max(...actualUser.notifications.map((n) => n.id));
      notification.id = maxId + 1;
      actualUser.notifications.push(notification);
    }
    if (actualUser) return this.userService.updateUsers(actualUser);
    else return EMPTY;
  }
}
