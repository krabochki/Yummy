import { Component, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';
import { INotification } from '../../../models/notifications';
import { IUser, nullUser } from '../../../models/users';
import { UserService } from '../../../services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { trigger } from '@angular/animations';
import { onlyHeight } from 'src/tools/animations';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  animations:[trigger('height',onlyHeight())],
  styleUrls: ['./notifications-list.component.scss'],
})
export class NotificationsListComponent {
  @Input() notifies: INotification[] = [];
  @Input() user: IUser = nullUser;

  @Output() closeEmitter = new EventEmitter<boolean>();


}
