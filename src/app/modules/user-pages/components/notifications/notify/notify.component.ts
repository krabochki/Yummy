import { AfterContentChecked, ChangeDetectorRef, Component, Input } from '@angular/core';
import { INotification, nullNotification } from '../../../models/notifications';
import { style } from '@angular/animations';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-notify',
  templateUrl: './notify.component.html',
  styleUrls: ['./notify.component.scss'],
changeDetection:ChangeDetectionStrategy.OnPush
  
})
export class NotifyComponent  {
  @Input() notify: INotification = nullNotification;


  

  getClass() {
    const styleClasses = [];
    if (!this.notify.read) styleClasses.push('not-readed');
     if (this.notify.context === 'plan-reminder') return ['plan'];
     if (this.notify.context === 'plan-reminder-start') return ['plan-start'];
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
    if (this.notify.context === 'plan-reminder')
      return '../../../../../assets/images/svg/' + 'pot.svg';
    if(this.notify.context === 'plan-reminder-start') return '../../../../../assets/images/svg/'+'clocks.svg';
    return '../../../../../assets/images/svg/' + this.notify.type + '.svg';
  }
}
