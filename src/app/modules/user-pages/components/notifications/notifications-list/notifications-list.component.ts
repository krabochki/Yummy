import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { INotification } from '../../../models/notifications';
import { IUser, nullUser } from '../../../models/users';
import { NotificationService } from '../../../services/notification.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsListComponent implements OnChanges, OnInit {
  @Input() notifies: INotification[] = [];
  private currentUser: IUser = { ...nullUser };
  @Output() hover = new EventEmitter<INotification>();

  @Output() closeEmitter = new EventEmitter<boolean>();

  constructor(
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.currentUser = receivedUser;
    });
  }

  ngOnChanges() {
    this.cd.markForCheck();
  }

  get isSomethingForClear(): boolean {
    let isSomethingForClear: boolean = false;
    this.notifies.forEach((n) => {
      if (!n.context.includes('plan')) isSomethingForClear = true;
    });
    return isSomethingForClear;
  }
  protected clearAll() {
    this.notifyService.clearAll(this.currentUser).subscribe({
      next: () => {
        const updatedNotifications = this.currentUser.notifications.filter(
          (n) => {

            return n.context === 'plan-reminder' ||
              n.context === 'plan-reminder-start';
          },
        );
        const updatedUser: IUser = {
          ...this.currentUser,
          notifications: updatedNotifications,
        };
        this.authService.setCurrentUser(updatedUser);
      },
      error: () => {},
    });
  }
}
