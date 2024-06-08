/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import {
  EMPTY,
  Observable,
  Subject,
  concatMap,
  finalize,
  from,
  tap,
} from 'rxjs';
import { IUser } from '../../models/users';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import {
  UserGroup,
  UsersType,
  noUsersText,
  searchTypes,
  userTitles,
} from './consts';
import { Title } from '@angular/platform-browser';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  styleUrls: [
    './users-page.component.scss',
    '../../../authentication/common-styles.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
})
export class UsersPageComponent implements OnInit, OnDestroy {
  private destroyed$: Subject<void> = new Subject<void>();
  protected filter: string = '';
  protected userType: UsersType = UsersType.All;
  allUsers: IUser[] = [];

  loaded = true;
  everythingLoaded = false;
  usersPerStep = 6;
  mainPageUsersPerStep = 6;
  currentStep = 0;
  initialLoading = true;
  loadingModal = false;

  searchTypes = searchTypes;
  currentUserId = 0;

  constructor(
    private userService: UserService,
    private title: Title,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 620) {
      this.usersPerStep = 4;
      this.mainPageUsersPerStep = 2;
    } else if (screenWidth <= 1080) {
      this.mainPageUsersPerStep = 4;
    }

    this.route.data.subscribe((data) => {
      this.filter = data['filter'];

      this.authService
        .getTokenUser()
        .pipe(
          tap((user) => {
            this.currentUserId = user.id;

            this.initialLoading = false;
            this.allUsers = [];
            this.loaded = true;
            this.everythingLoaded = false;
            this.currentStep = 0;

            this.setUserType(this.filter);
            this.initializeUsers();
          }),
        )
        .subscribe();
    });

  
  }

  getAvatar(user: IUser) {
    if (user.image) {
      this.userService
        .downloadUserpic(user.image)
        .pipe(
          tap((blob) => {
            user.avatarUrl = URL.createObjectURL(blob);
          }),
          finalize(() => {
            user.loadingImage = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  private getMostViewedUsers() {
    return this.userService
      .getMostViewedUsers(this.mainPageUsersPerStep, 0)
      .pipe(
        tap((response) => {
          this.updateUsers(
            response,
            'Самые просматриваемые',
            '/cooks/most-viewed',
            false,
          );
        }),
      );
  }

  private getNewUsers() {
    return this.userService.getNewUsers(this.mainPageUsersPerStep, 0).pipe(
      tap((response) => {
        this.updateUsers(response, 'Новые авторы', '/cooks/new', false);
      }),
    );
  }

  private getProductiveUsers() {
    return this.userService
      .getProductiveUsers(this.mainPageUsersPerStep, 0)
      .pipe(
        tap((response) => {
          this.updateUsers(
            response,
            'Самые продуктивные',
            '/cooks/productive',
            false,
          );
        }),
      );
  }

  private updateUsers(
    response: any,
    groupName: string,
    groupLink: string,
    groupAuth: boolean,
  ): void {
    const users: IUser[] = response.users;
    const newUsers: IUser[] = users.filter(
      (user: IUser) =>
        !this.allUsers.some((existingUser) => existingUser.id === user.id),
    );

    const userIds = users.map((user: IUser) => user.id);
    const group: UserGroup = {
      name: groupName,
      link: groupLink,
      auth: groupAuth,
      users: userIds,
    };
    this.userGroups.push(group);

    newUsers.map((u: any) => {
      if (u.image) {
        this.getAvatar(u);
      }
    });

    this.allUsers = [...this.allUsers, ...newUsers];
        this.blocks.pop();

    this.cd.markForCheck();
  }

  blocks = Array.from({ length: 6 }).map((_, index) => index + 1);

  userGroups: UserGroup[] = [];

  getUsersByGroup(name: string) {
    const group = this.userGroups.find((g) => g.name === name);
    if (group) {
      return group.users
        .map((userId) => this.allUsers.find((u) => u.id === userId))
        .filter((user) => !!user) as IUser[]; // Фильтруем undefined и приводим к типу Irecipe
    } else return [];
  }

  private getPopularUsers() {
    return this.userService.getPopularUsers(this.mainPageUsersPerStep, 0).pipe(
      tap((response) => {
        this.updateUsers(response, 'Самые популярные', '/cooks/popular', false);
      }),
    );
  }

  private getManagers() {
    return this.userService.getManagers(this.mainPageUsersPerStep, 0).pipe(
      tap((response) => {
        this.updateUsers(response, 'Управляющие', '/cooks/managers', false);
      }),
    );
  }

  private getUsersIFollow() {
    return this.userService
      .getUsersIFollow(this.mainPageUsersPerStep, 0)
      .pipe(
        tap((response) => {
          this.updateUsers(response, 'Ваши подписки', '/cooks/following', true);
        }),
      );
  }

  private getNearbyUsers() {
    return this.userService.getNearbyUsers(this.mainPageUsersPerStep, 0).pipe(
      tap((response) => {
        this.updateUsers(response, 'Кулинары рядом', '/cooks/nearby', true);
      }),
    );
  }

  allUsersLoaded = false;

  initializeUsers() {
    const subscribes$: Observable<any>[] = [];
    if (this.userType === UsersType.All) {
      subscribes$.push(this.getPopularUsers());
      if (this.currentUserId) {
        subscribes$.push(this.getUsersIFollow());
      }
      subscribes$.push(this.getProductiveUsers());
      if (this.currentUserId) {
        subscribes$.push(this.getNearbyUsers());
      }

      subscribes$.push(this.getMostViewedUsers());
      subscribes$.push(this.getManagers());
      subscribes$.push(this.getNewUsers());
    }

    this.title.setTitle(this.getTitleByUserType(this.userType));
    this.cd.markForCheck();

    if (this.userType === UsersType.All) {
      from(subscribes$)
        .pipe(concatMap((subscribe$) => subscribe$))
        .subscribe(() => {
          this.allUsersLoaded = true;
          this.cd.markForCheck();
        });
    } else {
      this.loadMoreUsers();
    }
  }

  getTitleByUserType(userType: UsersType): string {
    return userTitles[userType] || '';
  }

  getNoUsersTextByUserType(userType: UsersType): string {
    return noUsersText[userType] || '';
  }

  setUserType(filter: string): void {
    switch (filter) {
      case 'new':
        this.userType = UsersType.New;
        break;
      case 'popular':
        this.userType = UsersType.Popular;
        break;
      case 'all':
        this.userType = UsersType.All;
        break;

      case 'following':
        this.userType = UsersType.Following;
        break;
      case 'productive':
        this.userType = UsersType.Productive;
        break;
      case 'managers':
        this.userType = UsersType.Managers;
        break;
      case 'most-viewed':
        this.userType = UsersType.MostViewed;
        break;
      case 'nearby':
        this.userType = UsersType.Nearby;
        break;
    }
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  loadMoreUsers() {
    let context: Observable<any> = EMPTY;
    if (this.loaded || !this.allUsers.length) {
      switch (this.userType) {
        case UsersType.Nearby:
          context = this.userService.getNearbyUsers(
            this.usersPerStep,
            this.currentStep,
          );
          break;
        case UsersType.Popular:
          context = this.userService.getPopularUsers(
            this.usersPerStep,
            this.currentStep,
          );
          break;
        case UsersType.Following:
          context = this.userService.getUsersIFollow(
            this.usersPerStep,
            this.currentStep,
          );
          break;

        case UsersType.MostViewed:
          context = this.userService.getMostViewedUsers(
            this.usersPerStep,
            this.currentStep,
          );
          break;
        case UsersType.Productive:
          context = this.userService.getProductiveUsers(
            this.usersPerStep,
            this.currentStep,
          );
          break;
        case UsersType.Managers:
          context = this.userService.getManagers(
            this.usersPerStep,
            this.currentStep,
          );
          break;
        case UsersType.New:
          context = this.userService.getNewUsers(
            this.usersPerStep,
            this.currentStep,
          );
      }

      this.loaded = false;
      this.cd.markForCheck();
      context
        .pipe(
          tap((response: any) => {
            const receivedUsers: IUser[] = response.users;
            const length: number = response.count;

            this.currentStep++;

            this.allUsers = [...this.allUsers, ...receivedUsers];
            receivedUsers.map((u) => {
              if (u.image) {
                this.getAvatar(u);
              }
            });

            if (length <= this.allUsers.length) {
              this.everythingLoaded = true;
            }
          }),
          finalize(() => {
            this.loaded = true;
            this.cd.markForCheck();
          }),
        )

        .subscribe();
    }
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
