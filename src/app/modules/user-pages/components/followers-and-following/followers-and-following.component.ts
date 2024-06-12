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
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  debounceTime,
  finalize,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { modal } from 'src/tools/animations';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Permission } from '../settings/conts';

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
  @Input() object: 'followers' | 'following' = 'following';
  @Input() user: IUser = { ...nullUser };
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() followingEmitter: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  searchMode: boolean = false;
  searchQuery: string = '';
  subscriptions = new Subscription();
  protected destroyed$: Subject<void> = new Subject<void>();
  currentUser: IUser = { ...nullUser };
  constructor(
    private renderer: Renderer2,
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
    public userService: UserService,
  ) {}

  ngOnInit(): void {
    addModalStyle(this.renderer);
    this.loadFollowers();
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
        (user) => {
          this.currentUser = user;
          this.cd.markForCheck();
        }
      ));
  }

  loading = true;
  limit = 20;
  users: IUser[] = [];
  totalUsers: number = 0;
  offset = 0;

  loadFollowers() {
    this.loading = true;
    this.spinner = true;
    const waitingForLoading = this.totalUsers - this.users.length;
    if (waitingForLoading) {
      this.pushPreloaders(
        waitingForLoading < this.limit ? waitingForLoading : this.limit,
      );
    }
    setTimeout(() => {
      this.subscriptions.add(
        this.findUsers().pipe(takeUntil(this.destroyed$)).subscribe(),
      );
    }, 300);

  }

  findUsers() {
    const observable$ =
      this.object === 'followers'
        ? this.userService.getSomeFollowers(
            this.user.id,
            this.offset,
            this.limit,
            this.searchQuery,
          )
        : this.userService.getSomeFollowings(
            this.user.id,
            this.offset,
            this.limit,
            this.searchQuery,
          );
    return observable$.pipe(
      tap((data: any) => {
        this.users = this.users.concat(data.users);
        this.totalUsers = data.total;
        this.users.forEach((user) => {
          this.loadImage(user);
        });
        this.filterPreloader();
        this.spinner = false;
        this.loading = false;
        this.cd.markForCheck();
      }),
    );
  }

  changeState() {
    this.users = [];
    this.totalUsers = 0;
    this.offset = 0;
    

    this.loadFollowers();
  }

  loadMoreFollowers() {
    this.offset += this.limit; // Увеличиваем смещение на текущий лимит
    this.loadFollowers();
  }

  onScroll(event: any) {
    const element = event.target;
    const atBottom =
      element.scrollHeight - element.scrollTop - 2 <= element.clientHeight;

    if (atBottom && !this.loading && this.users.length < this.totalUsers) {
      this.offset = this.users.length;

      this.loadFollowers();
    }
  }

  filterPreloader() {
    this.users = this.users.filter((n) => n.id);
    this.cd.markForCheck();
  }

  pushPreloaders(n: number) {
    for (let index = 0; index < n; index++) {
      this.users.push(nullUser);
    }
    this.cd.markForCheck();
  }

  noUserpic = '/assets/images/userpic.png';

  loadImage(follower: IUser) {
    if (follower.image) {
      this.subscriptions.add(
        this.userService
          .downloadUserpic(follower.image)
          .pipe(
            takeUntil(this.destroyed$),
            tap((blob) => {
              follower.avatarUrl = URL.createObjectURL(blob);
            }),
            finalize(() => {
              this.cd.markForCheck();
            }),
          )
          .subscribe());
    }
  }

  switchObject(object: 'following' | 'followers') {
    if (!this.loading) {
      if (this.searchMode) {
        this.searchMode = !this.searchMode;
        this.searchQuery = '';
      }
      if (object !== this.object) {
        this.object = object;

        this.changeState();
        this.cd.markForCheck();
      }
    }
  }

  //подписка текущего пользователя на людей в списке
  follow(user: IUser) {
    if (this.currentUser.id && user.id) {
      if (user.isFollower) {
        this.unfollow(user);
        return;
      }
      this.userService.followUser( user.id).subscribe({
        next: () => {
          user.isFollower = 1;
          if (this.currentUser.id === this.user.id) {
            this.followingEmitter.emit(true);
          }

          this.cd.markForCheck();
          this.userService
            .getLimitation(user.id, Permission.FollowToYou)
            .subscribe((limit) => {
              if (!limit) {
                const notify: INotification =
                  this.notifyService.buildNotification(
                    'Новый подписчик',
                    `Кулинар ${
                      this.currentUser.fullName || `@${this.currentUser.username}`
                    } подписался на тебя`,
                    'info',
                    'user',
                    `/cooks/list/${this.currentUser.id}`,
                  );
                this.notifyService
                  .sendNotification(notify, user.id)
                  .subscribe();
              }
            });
        },
      });
    } else {
      this.noAccessModalShow = true;
    }
  }

  noAccessModalShow = false;

  //отписка текущего пользователя от людей в списке
  unfollow(user: IUser) {
    this.userService.unfollowUser(user.id).subscribe({
      next: () => {
        user.isFollower = 0;
        if (this.currentUser.id === this.user.id) {
          this.followingEmitter.emit(false);
        }

        this.cd.markForCheck();
      },
    });
  }

  searchOnOff() {
    if (!this.loading) {
      this.searchMode = !this.searchMode;
      if (!this.searchMode && this.searchQuery) {
        this.searchQuery = '';

        this.changeState();
      }
    }
  }

  //переход по ссылке на человека
  goToFollowerAccount(uri: string) {
    this.router.navigateByUrl(uri);
    this.closeEmitter.emit(true);
  }

  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchSubscription?: Subscription;

  filter() {
    this.searchQuerySubject.next(this.searchQuery);
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    this.filterPreloader();
    this.users = [];
    this.totalUsers = 0;
    this.spinner = true;
    this.offset = 0;
    this.subscriptions.add(
      this.searchSubscription = this.searchQuerySubject
        .pipe(
          takeUntil(this.destroyed$),
          debounceTime(1000),
          switchMap((query) => {
            this.searchQuery = query;
            this.loading = true;
            const subscribe: Observable<any> = this.findUsers();
            return subscribe;
          }),
        )
        .subscribe());
  }

  spinner = true;
  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  handleAccessModal(response: boolean) {
    this.noAccessModalShow = false;
    if (response) {
      this.router.navigateByUrl('/greetings');
    } else {
      addModalStyle(this.renderer);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
    removeModalStyle(this.renderer);
  }
}
