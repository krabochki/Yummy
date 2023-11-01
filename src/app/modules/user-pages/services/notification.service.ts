import { Injectable } from '@angular/core';
import { AuthService } from '../../authentication/services/auth.service';
import { UserService } from './user.service';
import { INotification, nullNotification } from '../models/notifications';
import { getCurrentDate } from 'src/tools/common';
import { IUser } from '../models/users';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) { }

  buildNotification(
    title: string,
    text: string,
    type: 'info' | 'warning' | 'error' | 'success',
    context: 'category' | 'recipe' | 'without'|'comment',
    link:string
    
  ): INotification {
    const notification: INotification = {
      ...nullNotification,
      title: title,
      relatedLink:link,
      context:context,
      message: text,
      type: type,
      timestamp: getCurrentDate(),
    };
    return notification;
  }

  sendNotification(notification: INotification, user: IUser) {
    if (!user.notifications) {
      user.notifications = [];
    }
    const maxId = Math.max(...user.notifications.map((n) => n.id));
    notification.id = maxId + 1;
    user.notifications.push(notification);
    return this.userService.updateUsers(user);
  }
}
