import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { INotification } from '../../../models/notifications';
import { IUser, nullUser } from '../../../models/users';
import { trigger } from '@angular/animations';
import { onlyHeight } from 'src/tools/animations';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  animations:[trigger('height',onlyHeight())],
  styleUrls: ['./notifications-list.component.scss'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class NotificationsListComponent {
  @Input() notifies: INotification[] = [];
  @Input() user: IUser = {...nullUser};

  @Output() closeEmitter = new EventEmitter<boolean>();


}
