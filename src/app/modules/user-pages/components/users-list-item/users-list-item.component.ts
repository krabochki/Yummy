import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { IUser, nullUser } from '../../models/users';
import { UserService } from '../../services/user.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';

@Component({
  selector: 'app-users-list-item',
  templateUrl: './users-list-item.component.html',
  styleUrls: ['./users-list-item.component.scss'],
  animations: [trigger('modal', modal())],
})
export class UsersListItemComponent implements OnInit, OnDestroy {
  @Input() user: IUser = { ...nullUser };
  noAvatar = '/assets/images/userpic.png';
  currentUser: IUser = { ...nullUser };
  noAccessModalShow = false;
  private destroyed$: Subject<void> = new Subject<void>();

  @Output() followStateChanges = new EventEmitter();
  @Input() loading = 0;

  users: IUser[] = [];
  // currentUser: null

  constructor(
    private userService: UserService,
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    if (this.loading) return;
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user) => {
        this.currentUser = user;
      });

 
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  clickFollowButton() {
    if (this.currentUser.id > 0) {
      !this.isFollower ? this.follow() : this.unfollow();
    } else {
      this.noAccessModalShow = true;
    }
  }

  follow() {
    if (this.currentUser.id > 0) {
      this.userService
        .followUser(this.user.id)
        .pipe(
          tap(() => {
            this.followStateChanges.emit();
          }),
        )
        .subscribe({
          next: () => {
            if (!this.user.followersCount) {
              this.user.followersCount = 0;
            }

            this.user.followersCount++;
            this.user.isFollower = 1;
            this.cd.markForCheck();
            // this.userService.getPermission('new-follower', this.user)

            if (this.currentUser.id > 0) {
              const notify: INotification =
                this.notifyService.buildNotification(
                  'Новый подписчик',
                  `Кулинар ${
                    this.currentUser.fullName
                      ? this.currentUser.fullName
                      : '@' + this.currentUser.username
                  } подписался на тебя`,
                  'info',
                  'user',
                  '/cooks/list/' + this.currentUser.id,
                );
              this.notifyService
                .sendNotification(notify, this.user.id)
                .subscribe();
            }
          },
        });
    }
  }

  unfollow() {
    if (this.currentUser.id > 0) {
      this.userService
        .unfollowUser(this.user.id)
        .subscribe({
          next: () => {
            if (this.user.followersCount) {
              this.user.followersCount--;
              this.user.isFollower = 0;
            }
            this.cd.markForCheck();
          },
        });
    }
  }

  get isFollower() {
    return this.user.isFollower;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
