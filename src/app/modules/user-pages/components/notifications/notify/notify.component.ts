import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { INotification, nullNotification } from '../../../models/notifications';
import { ChangeDetectionStrategy } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { IUser, nullUser } from '../../../models/users';

@Component({
  selector: 'app-notify',
  templateUrl: './notify.component.html',
  styleUrls: ['./notify.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyComponent {
  @Input() notify: INotification = nullNotification;
  @Input() user: IUser = nullUser;
  @Output() notifyDeleteClick = new EventEmitter();
  @Input() popup: boolean = false;

  constructor(private notificationService: NotificationService) {}
  protected deleteNotify() {
    if (this.popup) {
      this.notifyDeleteClick.emit();
    } else {
      this.notificationService
        .removeNotification(this.notify, this.user)
        .subscribe();
    }
  }

  getClass() {
    const styles: string[] = [];
    if (!this.notify.read) styles.push('not-readed');
    switch (this.notify.context) {
      case 'plan-reminder':
        styles.push('plan');
        break;
      case 'born':
        styles.push('born');
        break;
      case 'plan-reminder-start':
        styles.push('plan-start');
        break;
      case 'calendar-recipe':
        styles.push('calendar-recipe');
        break;
      case 'hire':
        styles.push('plan');
        break;
      case 'demote':
        styles.push('error');
        break;
    }
    switch (this.notify.type) {
      case 'info':
        styles.push('info');
        break;
      case 'warning':
        styles.push('warning');
        break;
      case 'error':
        styles.push('error');
        break;
      case 'success':
        styles.push('success');
        break;
    }
    return styles;
  }

  get icon() {
    const basePath = 'assets/images/svg/';
    if (this.notify.context === 'hire') return basePath + 'case.svg';
    if (this.notify.context === 'born') return basePath + 'champagne.svg';
    if (this.notify.context === 'demote') return basePath + 'demote.svg';
    if (this.notify.context === 'plan-reminder') return basePath + 'pot.svg';
    if (this.notify.context === 'calendar-recipe')
      return basePath + 'plan-notify.svg';
    if (this.notify.context === 'plan-reminder-start')
      return basePath + 'clocks.svg';
    return basePath + this.notify.type + '.svg';
  }
}
