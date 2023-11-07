import { AfterContentChecked, ChangeDetectorRef, Component, Input } from '@angular/core';
import { INotification, nullNotification } from '../../../models/notifications';
import { style } from '@angular/animations';
import { ChangeDetectionStrategy } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { IUser, nullUser } from '../../../models/users';

@Component({
  selector: 'app-notify',
  templateUrl: './notify.component.html',
  styleUrls: ['./notify.component.scss'],
changeDetection:ChangeDetectionStrategy.OnPush
  
})
export class NotifyComponent  {
  @Input() notify: INotification = nullNotification;
  @Input() user: IUser = nullUser;


  constructor(private notificationService:NotificationService){}
  protected deleteNotify() {
        

    this.notificationService.removeNotification(this.notify,this.user).subscribe()
  }

  getClass() {
    const styleClasses = [];
    if (!this.notify.read) styleClasses.push('not-readed');
     if (this.notify.context === 'plan-reminder') return ['plan'];
     if (this.notify.context === 'plan-reminder-start') return ['plan-start'];
     if (this.notify.context === 'calendar-recipe') return ['calendar-recipe'];
     if (this.notify.context === 'hire') return ['hire'];
     if (this.notify.context === 'demote') return ['error'];
    switch (this.notify.type) {
      case 'info':
        styleClasses.push('info');
        break;
      case 'warning':
        styleClasses.push('warning');
        break;
      case 'error':
        styleClasses.push('error');
        break;
      case 'success':
        styleClasses.push('success');
        break;
      default:
        break;
    }
    return styleClasses;
  }

  get icon() {
    const basePath = '../../../../../assets/images/svg/';
    if (this.notify.context === 'hire') return basePath + 'case.svg';
    if (this.notify.context === 'demote') return basePath + 'demote.svg';
    if (this.notify.context === 'plan-reminder')
      return basePath + 'pot.svg';
    if (this.notify.context === 'calendar-recipe')
      return basePath + 'plan-notify.svg';
    if(this.notify.context === 'plan-reminder-start') return basePath + 'clocks.svg';
    return basePath + this.notify.type + '.svg';
  }
}
