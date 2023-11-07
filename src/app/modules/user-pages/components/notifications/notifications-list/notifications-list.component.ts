import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { INotification } from '../../../models/notifications';
import { IUser, nullUser } from '../../../models/users';
import { NotificationService } from '../../../services/notification.service';


@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class NotificationsListComponent {
  @Input() notifies: INotification[] = [];
  @Input() user: IUser = {...nullUser};

  @Output() closeEmitter = new EventEmitter<boolean>();

  constructor(private notifyService:NotificationService){}


  get isSomethingForClear(): boolean {
    let isSomethingForClear: boolean = false;
    this.notifies.forEach(n => {
      if (!n.context.includes('plan')) isSomethingForClear=true;
    });
    return isSomethingForClear;
  }
  protected clearAll()
  {
    this.notifyService.clearAll(this.user).subscribe()
    
  }


}
