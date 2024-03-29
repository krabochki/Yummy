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
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { modal } from 'src/tools/animations';

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

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.following = this.userService.getFollowing(data, this.user.id);
        this.followers = this.userService.getFollowers(data, this.user.id);
        this.followingDisplay = this.following;
        this.followersDisplay = this.followers;
        if (this.currentUser.id !== 0) {
          const currentUserFollowing = this.userService.getFollowing(
            data,
            this.currentUser?.id,
          );
          this.currentUserFollowingIds = [];
          currentUserFollowing.forEach((currFollowing) => {
            this.currentUserFollowingIds.push(currFollowing.id);
          });
          this.cd.detectChanges();
        }
      });
  }

  noUserpic = '/assets/images/userpic.png';

  getUserpic(user: IUser) {
    if (user.avatarUrl) {
      return supabase.storage.from('userpics').getPublicUrl(user.avatarUrl).data
        .publicUrl;
    } else return this.noUserpic;
  }

  switchObject(object: 'following' | 'followers') {
    if (this.searchMode) this.searchOnOff();
    if (object === 'following') {
      this.object = 'following';
    } else {
      this.object = 'followers';
    }
    this.cd.markForCheck();
  }

  async updateUser(user: IUser) {
    await this.userService.updateUserInSupabase(user);
  }

  //подписка текущего пользователя на людей в списке
  async follow(user: IUser) {
    if (!user.loading) {
      if (this.currentUser.id > 0) {
        user.loading = true;
        this.cd.markForCheck();

        user = this.userService.addFollower(user, this.currentUser?.id);
        await this.updateUser(user);
        if (this.userService.getPermission('new-follower', user)) {
          const notify: INotification = this.notifyService.buildNotification(
            'Новый подписчик',
            `Кулинар ${this.currentUser.fullName
              ? this.currentUser.fullName
              : '@' + this.currentUser.username
            } подписался на тебя`,
            'info',
            'user',
            '/cooks/list/' + this.currentUser.id,
          );
          await this.notifyService.sendNotification(notify, user);
                user.loading = false;
          this.cd.markForCheck();
        }
      } else {
        this.noAccessModalShow = true;
      }
    }
  }

  noAccessModalShow = false;

  //отписка текущего пользователя от людей в списке
  async unfollow(user: IUser) {
    if (!user.loading) {
      if (this.currentUser.id > 0) {
        user.loading = true;
        user = this.userService.removeFollower(user, this.currentUser?.id);
        await this.updateUser(user);
        user.loading = false;
        this.cd.markForCheck();
      }
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
        this.followersDisplay = this.followers.filter(
          (follower: IUser) =>
            follower.fullName
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            follower.username
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()),
        );
      } else {
        this.followersDisplay = this.followers; // Если поле поиска пустое, показать всех подписчиков
      }
    } else {
      if (this.searchQuery) {
        this.followingDisplay = this.following.filter(
          (follower: IUser) =>
            follower.fullName
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            follower.username.toLowerCase().includes(this.searchQuery),
        );
      } else {
        this.followingDisplay = this.following; // Если поле поиска пустое, показать всех подписчиков
      }
    }
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }
}
