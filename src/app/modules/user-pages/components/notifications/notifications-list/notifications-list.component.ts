import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { INotification, nullNotification } from '../../../models/notifications';
import { NotificationService } from '../../../services/notification.service';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsListComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Output() hover = new EventEmitter<INotification>();
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() clickEmitter = new EventEmitter<boolean>();
  offset: number = 0;
  limit: number = 10; // Начальный лимит

  notifications: INotification[] = []; // список уведомлений
  totalNotifications: number = 0; // общее количество уведомлений

  constructor(
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    addModalStyle(this.renderer);
    this.loadNotifications();
  }

  ngOnChanges() {
    this.cd.markForCheck();
  }

  makeAllNotifiesReaded() {
    this.notifyService.markNotificationsAsRead().subscribe();
  }

  protected clearAll() {
    this.notifyService.clearAll().subscribe({
      next: () => {
        this.notifications = this.notifications.filter((n) =>
          n.context.includes('plan'),
        );
        this.totalNotifications = this.notifications.length;
        this.cd.markForCheck();
      },
      error: () => {},
    });
  }

  loadNotifications() {
    this.loading = true;
    this.pushPreloaders(this.limit);
    this.subscriptions.add(
      this.notifyService
        .getSomeNotifications(0, this.limit)
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.notifications = data.notifications;
          this.totalNotifications = data.total;
          this.loading = false;
          this.filterPreloader();
          this.makeAllNotifiesReaded();
          this.cd.markForCheck();
        }),
    );
  }

  loading = true;

  onScroll(event: any) {
    const element = event.target;
    const atBottom =
      element.scrollHeight - element.scrollTop - 2 <= element.clientHeight;

    if (
      atBottom &&
      !this.loading &&
      this.notifications.length < this.totalNotifications
    ) {
      this.loading = true;
      const offset = this.notifications.length;
      const limit = this.limit;

      const waitingForLoading =
        this.totalNotifications - this.notifications.length;
      this.pushPreloaders(
        waitingForLoading < this.limit ? waitingForLoading : this.limit,
      );
      setTimeout(() => {
        this.subscriptions.add(
          this.notifyService
            .getSomeNotifications(offset, limit)
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data) => {
              this.notifications = this.notifications.concat(
                data.notifications,
              );
              this.loading = false;
              this.filterPreloader();
              this.cd.markForCheck();
            }),
        );
      }, 300);
      // Прокрутка достигла нижнего края, загружаем дополнительные уведомления
    }
  }

  deleteNotify(notify: INotification) {
    this.notifications = this.notifications.filter((n) => n.id !== notify.id);
    if (this.totalNotifications > 0) this.totalNotifications--;
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
  subscriptions = new Subscription();
  protected destroyed$: Subject<void> = new Subject<void>();

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
    removeModalStyle(this.renderer);
  }
}
