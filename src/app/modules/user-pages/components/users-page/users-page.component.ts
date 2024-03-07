import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import {
  EMPTY,
  Observable,
  Subject,
  finalize,
  forkJoin,
  takeUntil,
  tap,
} from 'rxjs';
import { IUser, nullUser } from '../../models/users';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { UsersType, noUsersText, searchTypes, userTitles } from './consts';
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
  protected popularUsers: IUser[] = [];
  protected nearbyUsers: IUser[] = [];
  protected allUsers: IUser[] = [];
  protected mostProductiveUsers: IUser[] = [];
  protected administratorsAndModerators: IUser[] = [];
  protected currentUserFollowingUsers: IUser[] = [];
  protected mostViewedUsers: IUser[] = [];
  protected newUsers: IUser[] = [];
  protected currentUser: IUser = { ...nullUser };
  protected filter: string = '';
  protected userType: UsersType = UsersType.All;

  loaded = true;
  everythingLoaded = false;
  usersPerStep = 6;
  mainPageUsersPerStep = 6;
  currentStep = 0;
  initialLoading = false;
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
    }
    else if (screenWidth <= 1080) {
      this.mainPageUsersPerStep = 4;
    }

    this.route.data.subscribe((data) => {
      this.filter = data['filter'];

      this.authService
        .getTokenUser()
        .pipe(
          tap((user) => {
            this.currentUserId = user.id;

            this.initialLoading = true;
            this.userService.setUsers([]);
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

    this.userService.users$.subscribe((users) => {
      this.allUsers = users;
    });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.currentUser = data;
      });
  }

  followsChanges() {
    this.currentUserFollowingUsers = [];
    this.loadingModal = true;
    setTimeout(() => {
      this.getUsersIFollow().subscribe(() => {
        this.loadingModal = false;
        this.cd.markForCheck();
      });
    }, 100);
  }

  private getProductiveUsers() {
    return this.userService.getProductiveUsers(this.mainPageUsersPerStep, 0, this.currentUser.id).pipe(
      tap((response) => {
        const users = response.users;
        const newUsers = users.filter(
          (user) =>
            !this.allUsers.some((existingUser) => existingUser.id === user.id),
        );
        newUsers.map((u) => this.userService.addUserToUsers(u));
        newUsers.map((u) => {
          if (u.image) {
            this.userService.getAvatar(u);
          }
        });

        this.mostProductiveUsers = users;
        this.cd.markForCheck();
      }),
    );
  }
  private getMostViewedUsers() {
    return this.userService.getMostViewedUsers(this.mainPageUsersPerStep, 0, this.currentUser.id).pipe(
      tap((response) => {
        const users = response.users;
        const newUsers = users.filter(
          (user) =>
            !this.allUsers.some((existingUser) => existingUser.id === user.id),
        );
        newUsers.map((u) => this.userService.addUserToUsers(u));
        newUsers.map((u) => {
          if (u.image) {
            this.userService.getAvatar(u);
          }
        });

        this.mostViewedUsers = users;
        this.cd.markForCheck();
      }),
    );
  }

  private getNewUsers() {
    return this.userService.getNewUsers(this.mainPageUsersPerStep, 0, this.currentUser.id).pipe(
      tap((response) => {
        const users = response.users;
        const newUsers = users.filter(
          (user) =>
            !this.allUsers.some((existingUser) => existingUser.id === user.id),
        );
        newUsers.map((u) => this.userService.addUserToUsers(u));
        newUsers.map((u) => {
          if (u.image) {
            this.userService.getAvatar(u);
          }
        });

        this.newUsers = users;
        this.cd.markForCheck();
      }),
    );
  }
  private getPopularUsers() {
    return this.userService.getPopularUsers(this.mainPageUsersPerStep, 0, this.currentUser.id).pipe(
      tap((response) => {
        const users = response.users;
        const newUsers = users.filter(
          (user) =>
            !this.allUsers.some((existingUser) => existingUser.id === user.id),
        );
        newUsers.map((u) => this.userService.addUserToUsers(u));
        newUsers.map((u) => {
          if (u.image) {
            this.userService.getAvatar(u);
          }
        });

        this.popularUsers = users;
        this.cd.markForCheck();
      }),
    );
  }

  private getManagers() {
    return this.userService.getManagers(this.mainPageUsersPerStep, 0, this.currentUser.id).pipe(
      tap((response) => {
        const users = response.users;
        const newUsers = users.filter(
          (user) =>
            !this.allUsers.some((existingUser) => existingUser.id === user.id),
        );
        newUsers.map((u) => this.userService.addUserToUsers(u));
        newUsers.map((u) => {
          if (u.image) {
            this.userService.getAvatar(u);
          }
        });

        this.administratorsAndModerators = users;
        this.cd.markForCheck();
      }),
    );
  }

  private getUsersIFollow() {
    return this.userService.getUsersIFollow(this.mainPageUsersPerStep, 0, this.currentUser.id).pipe(
      tap((response) => {
        const users = response.users;

        const newUsers = users.filter(
          (user) =>
            !this.allUsers.some((existingUser) => existingUser.id === user.id),
        );
        newUsers.map((u) => this.userService.addUserToUsers(u));
        newUsers.map((u) => {
          if (u.image) {
            this.userService.getAvatar(u);
          }
        });

        this.currentUserFollowingUsers = users;
        this.cd.markForCheck();
      }),
    );
  }

  private getNearbyUsers() {
    return this.userService.getNearbyUsers(this.mainPageUsersPerStep, 0, this.currentUser.id).pipe(
      tap((response) => {
        const users = response.users;
        const newUsers = users.filter(
          (user) =>
            !this.allUsers.some((existingUser) => existingUser.id === user.id),
        );
        newUsers.map((u) => this.userService.addUserToUsers(u));
        newUsers.map((u) => {
          if (u.image) {
            this.userService.getAvatar(u);
          }
        });

        this.nearbyUsers = users;
        this.cd.markForCheck();
      }),
    );
  }

  initializeUsers() {
    const subscribes$: Observable<any>[] = [];
    if (this.userType === UsersType.All) {
      subscribes$.push(this.getProductiveUsers());
      subscribes$.push(this.getPopularUsers());
      subscribes$.push(this.getMostViewedUsers());
      subscribes$.push(this.getNewUsers());
      subscribes$.push(this.getManagers());
      if (this.currentUser.id) {
        subscribes$.push(this.getUsersIFollow());
        subscribes$.push(this.getNearbyUsers());
      }
    }

    this.title.setTitle(this.getTitleByUserType(this.userType));
    this.cd.markForCheck();

    if (this.userType === UsersType.All) {
      setTimeout(() => {
        forkJoin(subscribes$).subscribe(() => {
          this.initialLoading = false;
          this.cd.markForCheck();
        });
      }, 300);
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
            this.currentUserId,
          );
          break;
        case UsersType.Popular:
          context = this.userService.getPopularUsers(
            this.usersPerStep,
            this.currentStep,
            this.currentUserId,
          );
          break;
        case UsersType.Following:
          context = this.userService.getUsersIFollow(
            this.usersPerStep,
            this.currentStep,
            this.currentUserId,
          );
          break;

        case UsersType.MostViewed:
          context = this.userService.getMostViewedUsers(
            this.usersPerStep,
            this.currentStep,
            this.currentUserId,
          );
          break;
        case UsersType.Productive:
          context = this.userService.getProductiveUsers(
            this.usersPerStep,
            this.currentStep,
            this.currentUserId,
          );
          break;
        case UsersType.Managers:
          context = this.userService.getManagers(
            this.usersPerStep,
            this.currentStep,
            this.currentUserId,
          );
          break;
        case UsersType.New:
          context = this.userService.getNewUsers(
            this.usersPerStep,
            this.currentStep,
            this.currentUserId,
          );
      }

      this.loaded = false;
      this.cd.markForCheck();
      setTimeout(() => {
        context
          .pipe(
            tap((response: any) => {
              const receivedUsers: IUser[] = response.users;
              const length: number = response.count;

              this.currentStep++;

              receivedUsers.map((user) => {
                this.userService.addUserToUsers(user);
                this.userService.getAvatar(user);
              });

              if (length <= this.allUsers.length) {
                this.everythingLoaded = true;
              }
            }),
            finalize(() => {
              this.loaded = true;
              this.initialLoading = false;
              this.cd.markForCheck();
            }),
          )

          .subscribe();
      }, 300);
    }
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
