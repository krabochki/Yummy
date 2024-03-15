import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { IUser, nullUser } from '../../models/users';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';
import { widthAnim } from 'src/tools/animations';
import { Observable, Subject, finalize, forkJoin, takeUntil, tap } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { modal } from 'src/tools/animations';
import { addModalStyle, removeModalStyle } from 'src/tools/common';

@Component({
  selector: 'app-followers-and-following',
  templateUrl: './followers-and-following.component.html',
  styleUrls: ['./followers-and-following.component.scss'],
  animations: [
    trigger('search', widthAnim()),
    trigger('modal', modal()),

    trigger('magnifier', [
      state(
        'open',
        style({
          'margin-right': '20.9em',
          'margin-left': 0,
        }),
      ),
      state('closed', style({})),
      transition('open => closed', [animate('0.7s')]),
      transition('closed => open', [animate('0.4s')]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowersAndFollowingComponent implements OnInit, OnDestroy {
  @Input() userPage: IUser = { ...nullUser };
  @Input() currentUser: IUser = { ...nullUser };
  @Input() object: 'followers' | 'following' = 'following';
  @Input() user: IUser = { ...nullUser };
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  followers: IUser[] = [];
  following: IUser[] = [];
  followersDisplay: IUser[] = [];
  followingDisplay: IUser[] = [];
  currentUserFollowingIds: number[] = []; //подписки авторизованного пользователя

  searchMode: boolean = false;
  searchQuery: string = '';
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private renderer: Renderer2,
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private router: Router,
    public userService: UserService,
  ) {}

  users: IUser[] = [];
  ngOnInit(): void {
    addModalStyle(this.renderer);

    const subscribes$: Observable<any>[] = [];
    subscribes$.push(this.getFollowers());

    subscribes$.push(this.getFollowings());
    if (this.currentUser.id !== 0) {
      this.userService
        .getFollowingList(this.currentUser.id)
        .subscribe((followings) => {
          this.currentUserFollowingIds = followings.map((f) => f.id);
        });
    }
    forkJoin(subscribes$).subscribe(() => {
      this.cd.markForCheck();
    });
  }

  noUserpic = '/assets/images/userpic.png';

  getFollowers() {
    return this.userService.getFollowersList(this.user.id).pipe(
      tap((followers) => {
        this.followers = followers;
        this.followersDisplay = followers;


        
        this.followers.forEach((follower) => {
            this.loadImage(follower)
          
        });
      }),
    );
  }
  loadImage(follower:IUser) {
    if (follower.image) {
      this.userService
        .downloadUserpic(follower.image)
        .pipe(
          tap((blob) => {
            follower.avatarUrl = URL.createObjectURL(blob);
          }),
          finalize(() => {
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }
  getFollowings() {
    return this.userService.getFollowingList(this.user.id).pipe(
      tap((following) => {
        this.following = following;
        this.followingDisplay = following;
        this.following.forEach((follower) => {
          this.loadImage(follower);
        });
      }),
    );
  }
  switchObject(object: 'following' | 'followers') {
    if (this.searchMode) this.searchOnOff();
    if (object === 'following') {
      this.getFollowings().subscribe(() => {
        this.object = 'following';
        this.cd.markForCheck();
      });
    } else {
      this.getFollowers().subscribe(() => {
        this.object = 'followers';
        
        this.cd.markForCheck();
      });
    }
    this.cd.markForCheck();
  }

  @Output() editEmitter = new EventEmitter<number>();

  //подписка текущего пользователя на людей в списке
  follow(user: IUser) {
    if (this.currentUser.id > 0) {
      this.userService.followUser(this.currentUser.id, user.id).subscribe({
        next: () => {
          this.currentUserFollowingIds.push(user.id);
          if (this.user.id === this.currentUser.id) {
            this.editEmitter.emit(this.currentUserFollowingIds.length);
          }
          this.cd.markForCheck();
        //  if (this.userService.getPermission('new-follower', user)) {
            const findedCurrentUser =
              this.users.find((u) => u.id === this.currentUser.id) || nullUser;
            if (findedCurrentUser.id > 0) {
              const notify: INotification =
                this.notifyService.buildNotification(
                  'Новый подписчик',
                  `Кулинар ${
                    findedCurrentUser.fullName
                      ? findedCurrentUser.fullName
                      : '@' + findedCurrentUser.username
                  } подписался на тебя`,
                  'info',
                  'user',
                  '/cooks/list/' + this.currentUser.id,
                );
              this.notifyService.sendNotification(notify, user.id).subscribe();
            
          }
        },
      });
    } else {
      this.noAccessModalShow = true;
    }
  }

  noAccessModalShow = false;

  //отписка текущего пользователя от людей в списке
  unfollow(user: IUser) {
    if (this.currentUser.id > 0) {
      this.userService.unfollowUser(this.currentUser.id, user.id).subscribe({
        next: () => {
          this.currentUserFollowingIds = this.currentUserFollowingIds.filter(
            (f) => f != user.id,
          );
          if (this.user.id === this.currentUser.id) {
            this.editEmitter.emit(this.currentUserFollowingIds.length);
          }
          this.cd.markForCheck();
        },
      });
    }
  }

  searchOnOff() {
    this.searchMode = !this.searchMode;
    this.followingDisplay = this.following;
    this.followersDisplay = this.followers;
    this.searchQuery = '';
  }

  //переход по ссылке на человека
  goToFollowerAccount(uri: string) {
    this.router.navigateByUrl(uri);
    this.closeEmitter.emit(true);
  }

  filter() {
    if (this.object === 'followers') {
      if (this.searchQuery) {
        this.followersDisplay = this.followers.filter((follower: IUser) => {
          follower.fullName = follower.fullName || '';
          return (
            follower.fullName
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            follower.username
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())
          );
        });
      } else {
        this.followersDisplay = this.followers; // Если поле поиска пустое, показать всех подписчиков
      }
    } else {
      if (this.searchQuery) {
        this.followingDisplay = this.following.filter((follower: IUser) => {
          follower.fullName = follower.fullName || '';
          return (
            follower.fullName
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            follower.username.toLowerCase().includes(this.searchQuery)
          );
        });
      } else {
        this.followingDisplay = this.following; // Если поле поиска пустое, показать всех подписчиков
      }
    }
    this.cd.markForCheck();
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  handleAccessModal(response: boolean) {
          this.noAccessModalShow = false;
    if (response) {
    this.router.navigateByUrl('/greetings')
    }
    else {
      addModalStyle(this.renderer);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    removeModalStyle(this.renderer);
  }
}
