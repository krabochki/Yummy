import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { INotification, nullNotification } from '../../../models/notifications';
import { IUser, nullUser } from '../../../models/users';
import { NotificationService } from '../../../services/notification.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { addModalStyle, removeModalStyle } from 'src/tools/common';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsListComponent
  implements OnChanges, OnInit, OnDestroy
{
  private currentUser: IUser = { ...nullUser };
  @Output() hover = new EventEmitter<INotification>();
  @Output() closeEmitter = new EventEmitter<boolean>();
  offset: number = 0;
  limit: number = 7; // Начальный лимит

  notifications: INotification[] = []; // список уведомлений
  totalNotifications: number = 0; // общее количество уведомлений
  currentUserId = 0;

  constructor(
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private renderer: Renderer2,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    addModalStyle(this.renderer);
    this.authService.getTokenUser().subscribe((user) => {
      this.currentUserId = user.id;
      this.loadNotifications();
    });
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.currentUser = receivedUser;
    });
  }

  ngOnChanges() {
    this.cd.markForCheck();
  }

  makeAllNotifiesReaded() {
    this.notifyService.markNotificationsAsRead(this.currentUserId).subscribe();
  }

  protected clearAll() {
    this.notifyService.clearAll(this.currentUser).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n=>n.context.includes('plan'));
        this.totalNotifications = this.notifications.length;
        this.cd.markForCheck();
      },
      error: () => {},
    });
  }

  loadNotifications() {
    this.loading = true;
    this.pushPreloaders(7);
    this.notifyService
      .getSomeNotifications(this.currentUserId, 0, 7)
      .subscribe((data) => {
        this.notifications = data.notifications;
        this.totalNotifications = data.total;
        this.loading = false;
        this.filterPreloader();
        this.makeAllNotifiesReaded();
        this.cd.markForCheck();
      });
  }

  loadMoreNotifications() {
    this.offset += this.limit; // Увеличиваем смещение на текущий лимит
    this.loadNotifications();
  }

  loading = false;

  onScroll(event: any) {
    const element = event.target;
    const atBottom =
      element.scrollHeight - element.scrollTop -2 <= element.clientHeight;

    if (
      atBottom &&
      !this.loading &&
      this.notifications.length < this.totalNotifications
    ) {
      this.loading = true;
      const offset = this.notifications.length;
      const limit = 7;

      const waitingForLoading =
        this.totalNotifications - this.notifications.length;
      this.pushPreloaders(waitingForLoading < 7 ? waitingForLoading : 7);
      setTimeout(() => {
        this.notifyService
          .getSomeNotifications(this.currentUser.id, offset, limit)
          .subscribe((data) => {
            console.log(data);
            this.notifications = this.notifications.concat(data.notifications);
            this.loading = false;
            this.filterPreloader();
            this.cd.markForCheck();
          });
      }, 1000);
      // Прокрутка достигла нижнего края, загружаем дополнительные уведомления
    }
  }

  pushPreloaders(n: number) {
    for (let index = 0; index < n; index++) {
      this.notifications.push(nullNotification);
    }
    this.cd.markForCheck();
  }

  filterPreloader() {
    this.notifications = this.notifications.filter((n) => n.id);
    this.cd.markForCheck();
  }

  ngOnDestroy() {
    removeModalStyle(this.renderer);
  }
}
