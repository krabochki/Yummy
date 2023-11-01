import { Component, HostListener, Input, OnDestroy } from '@angular/core';
import { INotification } from '../../../models/notifications';
import { IUser, nullUser } from '../../../models/users';
import { UserService } from '../../../services/user.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
})
export class NotificationsListComponent implements OnDestroy {
  @Input() notifies: INotification[] = [];
  @Input() user: IUser = nullUser;

  constructor(private userService: UserService) {}

  async ngOnDestroy() {

    let haveNotRead: boolean = false;
    this.user.notifications.forEach((notification) => {
      if (notification.read === false) {
              haveNotRead = true;
            }
      notification.read = true;
    });

    if(haveNotRead)
    await this.userService.updateUsers(this.user).subscribe();
  }
}
