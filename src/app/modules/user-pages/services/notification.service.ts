import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { INotification, nullNotification } from '../models/notifications';
import { getCurrentDate } from 'src/tools/common';
import { IUser } from '../models/users';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private userService: UserService) {
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
      |'update'
      | 'without'
      | 'comment'
      | 'hire'
      | 'born'
      | 'user'
      | 'calendar-recipe'
      | 'ingredient'
      |'update'
      | 'demote'
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

  async updateUser(user: IUser) {
    await this.userService.updateUserInSupabase(user);
  }

 async removeNotification(notification: INotification, user: IUser) {
    const actualUser = this.users.find((u) => u.id === user.id);

    if (actualUser) {
      actualUser.notifications = actualUser?.notifications.filter(
        (n) => n.id !== notification.id,
      );
      await this.updateUser(actualUser);
    }
  }

  clearAll(user: IUser) {
    user.notifications = user.notifications.filter(
      (n) =>
        n.context === 'plan-reminder-start' || n.context === 'plan-reminder',
    );
    return this.updateUser(user);
  }

  makeNotifyReaded(notify:INotification,user:IUser) {
    
    const findedNotification = user.notifications.find(n => n.id === notify.id);
    if (findedNotification) {
      findedNotification.read = true;
    }
    return this.updateUser(user);
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
  async sendNotification(notification: INotification, user: IUser) {
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
    if (actualUser)
      await this.updateUser(actualUser)
  }
}
