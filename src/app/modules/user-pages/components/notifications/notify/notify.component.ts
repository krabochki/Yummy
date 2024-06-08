import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { INotification, nullNotification } from '../../../models/notifications';
import { ChangeDetectionStrategy } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { IUser, nullUser } from '../../../models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ThemeService } from 'src/app/modules/common-pages/services/theme.service';

@Component({
  selector: 'app-notify',
  templateUrl: './notify.component.html',
  styleUrls: ['./notify.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyComponent implements OnInit {
  @Input() notify: INotification = nullNotification;
  @Output() notifyDeleteClick = new EventEmitter<INotification>();
  @Output() clickEmitter = new EventEmitter();
  @Output() hover = new EventEmitter<INotification>();
  @Output() blurEmitter = new EventEmitter();
  @Input() popup: boolean = false;

  currentUser: IUser = { ...nullUser };

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.currentUser = receivedUser;
    });
  }

  protected deleteNotify() {
    if (this.notify.type !== 'night-mode') {
      if (this.popup) {
      
        this.notifyDeleteClick.emit();
      } else {
        this.notificationService.deleteNotification(this.notify.id).subscribe(
          
          () => {
            this.notifyDeleteClick.emit(this.notify);
        });
      }
    } else {
      this.notifyDeleteClick.emit();
    }
  }

  clickNotify() {
    if (this.notify.type === 'night-mode') {
      this.clickEmitter.emit();
      this.themeService.changeTheme();
    }
  }

  getClass() {
    const styles: string[] = [];
    if (!this.notify.read) styles.push('not-readed');
    
    if (this.popup) styles.push('popup');
    switch (this.notify.context) {
      case 'plan-reminder':
        styles.push('plan');
        break;
      case 'update':
        styles.push('update');
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
        styles.push('hire');
        break;
      case 'demote':
        styles.push('error');
        break;
    }
    switch (this.notify.type) {
      case 'info':
        styles.push('info');
        break;
      case 'night-mode':
        styles.push('night-mode');
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
    const basePath = '/assets/images/svg/';
    if (this.notify.context === 'hire') return basePath + 'case.svg';
    if (this.notify.context === 'star') return basePath + 'achieve.svg';
    if (this.notify.type === 'night-mode') return basePath + 'moon.svg';
    if (this.notify.context === 'update') return basePath + 'update.svg';
    if (this.notify.context === 'born') return basePath + 'champagne.svg';
    if (this.notify.context === 'manager') return basePath + 'work.svg';
    if (this.notify.context === 'demote') return basePath + 'demote.svg';
    if (this.notify.context === 'plan-reminder') return basePath + 'pot.svg';
    if (this.notify.context === 'calendar-recipe')
      return basePath + 'plan-notify.svg';
    if (this.notify.context === 'plan-reminder-start')
      return basePath + 'clocks.svg';
    return basePath + this.notify.type + '.svg';
  }
}
