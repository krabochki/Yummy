import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { IUser, nullUser } from '../../models/users';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { UsersType, noUsersText, userTitles } from './consts';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  styleUrls: [
    './users-page.component.scss',
    '../../../authentication/common-styles.scss',
  ],
  animations: [trigger('auto-complete', heightAnim())],
})
export class UsersPageComponent implements OnInit, OnDestroy {
  private destroyed$: Subject<void> = new Subject<void>();
  protected users: IUser[] = [];
  protected recipes: IRecipe[] = [];
  protected popularUsers: IUser[] = [];
  protected nearbyUsers: IUser[] = [];
  protected allUsers: IUser[] = [];
  protected moreProductiveUsers: IUser[] = [];
  protected administratorsAndModerators: IUser[] = [];
  protected currentUserFollowingUsers: IUser[] = [];
  protected moreViewedUsers: IUser[] = [];
  protected currentUserFollowersUsers: IUser[] = [];
  protected newUsers: IUser[] = [];
  protected currentUser: IUser = { ...nullUser };
  protected filter: string = '';
  protected userType: UsersType = UsersType.All;
  protected showUsers: IUser[] = [];
  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocompleteUsersList: IUser[] = [];

  constructor(
    private userService: UserService,
    private title: Title,
    private recipeService: RecipeService,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.filter = data['filter'];
      this.setUserType(this.filter);
    });
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.currentUser = data;
      });
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.recipes = data;
      });
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.users = data;

        this.popularUsers = this.getPopularUsers(this.users);
        this.nearbyUsers = this.getNearbyUsers(this.users);
        this.moreProductiveUsers = this.getMoreProductiveUsers(this.users);
        this.currentUserFollowingUsers = this.getCurrentUserFollowingUsers(
          this.users,
        );
        this.administratorsAndModerators = this.getAdministratorssAndModerators(
          this.users,
        );
        this.administratorsAndModerators =
          this.administratorsAndModerators.filter((m) => this.showStatus(m));
        this.currentUserFollowersUsers = this.getCurrentUserFollowersUsers(
          this.users,
        );
        this.newUsers = this.getNewUsers(this.users);
        this.moreViewedUsers = this.getMoreViewedUsers(this.users);

        switch (this.userType) {
          case UsersType.All:
            this.allUsers = this.users;
            this.popularUsers = this.getPublicUsers(this.popularUsers);
            this.nearbyUsers = this.getPublicUsers(this.nearbyUsers);
            this.moreProductiveUsers = this.getPublicUsers(
              this.moreProductiveUsers,
            );
            this.currentUserFollowersUsers = this.getPublicUsers(
              this.currentUserFollowersUsers,
            );
            this.currentUserFollowingUsers = this.getPublicUsers(
              this.currentUserFollowingUsers,
            );
            this.newUsers = this.getPublicUsers(this.newUsers);
            this.administratorsAndModerators = this.getPublicUsers(
              this.administratorsAndModerators,
            );
            this.moreViewedUsers = this.getPublicUsers(this.moreViewedUsers);
            break;
          case UsersType.Nearby:
            this.allUsers = this.nearbyUsers;
            break;
          case UsersType.Popular:
            this.allUsers = this.popularUsers;
            break;
          case UsersType.Followers:
            this.allUsers = this.currentUserFollowersUsers;
            break;
          case UsersType.Following:
            this.allUsers = this.currentUserFollowingUsers;
            break;
          case UsersType.MostViewed:
            this.allUsers = this.moreViewedUsers;
            break;
          case UsersType.Productive:
            this.allUsers = this.moreProductiveUsers;
            break;
          case UsersType.Managers:
            this.allUsers = this.administratorsAndModerators;
            break;
          case UsersType.New:
            this.allUsers = this.newUsers;
        }
        this.showUsers = this.getPublicUsers(this.allUsers).slice(0, 6);

        this.title.setTitle(this.getTitleByUserType(this.userType));
      });
  }
  showStatus(user: IUser) {
    return this.userService.getPermission('show-status', user);
  }

  getPublicUsers(users: IUser[]) {
    return users.filter((u) =>
      this.userService.getPermission('show-me-on-userspage', u),
    );
  }

  getTitleByUserType(userType: UsersType): string {
    return userTitles[userType] || '';
  }
  getNoUsersTextByUserType(userType: UsersType): string {
    return noUsersText[userType] || '';
  }

  private getNewUsers(users: IUser[]): IUser[] {
    users = users.sort((u1, u2) => {
      return u1.registrationDate < u2.registrationDate ? 1 : -1;
    });
    return users;
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
      case 'followers':
        this.userType = UsersType.Followers;
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

  protected loadMoreUsers() {
    const currentLength = this.showUsers.length;
    const nextUsers = this.getPublicUsers(this.allUsers).slice(
      currentLength,
      currentLength + 3,
    );
    this.showUsers = [...this.showUsers, ...nextUsers];
  }

  private getPopularUsers(users: IUser[]): IUser[] {
    return [...users].sort(
      (n1, n2) => n2.followersIds.length - n1.followersIds.length,
    );
  }
  private getNearbyUsers(users: IUser[]): IUser[] {
    return this.userService.getNearby(users, this.currentUser);
  }

  private getMoreViewedUsers(users: IUser[]): IUser[] {
    return [...users].sort((n1, n2) => n2.profileViews - n1.profileViews);
  }

  private getAdministratorssAndModerators(users: IUser[]): IUser[] {
    return [...users].filter((element) => element.role !== 'user').slice(0, 6);
  }

  private getUserRecipesLength(user: IUser, recipes: IRecipe[]): number {
    return this.recipeService.getRecipesByUser(
      this.recipeService.getPublicAndAllMyRecipes(
        [...recipes],
        this.currentUser.id,
      ),
      user.id,
    ).length;
  }

  private getCurrentUserFollowingUsers(users: IUser[]) {
    return this.userService.getFollowing(users, this.currentUser.id);
  }

  private getCurrentUserFollowersUsers(users: IUser[]) {
    return this.userService.getFollowers(users, this.currentUser.id);
  }

  private getMoreProductiveUsers(users: IUser[]): IUser[] {
    const moreProductive = [...users].sort((n1, n2) => {
      if (
        this.getUserRecipesLength(n1, this.recipes) >
        this.getUserRecipesLength(n2, this.recipes)
      ) {
        return -1;
      }
      if (
        this.getUserRecipesLength(n1, this.recipes) <
        this.getUserRecipesLength(n2, this.recipes)
      ) {
        return 1;
      }
      return 0;
    });
    return moreProductive;
  }

  searchOff() {
    this.searchQuery = '';
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  blur() {
    this.autocompleteShow = false;
  }

  focus() {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }

  search() {
    this.autocompleteShow = true;
    if (this.searchQuery && this.searchQuery !== '') {
      this.autocompleteUsersList = [];

      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      this.allUsers = this.allUsers.filter((u) =>
        this.userService.getPermission('search-me-on-userspage', u),
      );
      const filterUsers: IUser[] = this.allUsers.filter(
        (user: IUser) =>
          user.fullName.toLowerCase().replace(/\s/g, '').includes(search) ||
          user.username.toLowerCase().replace(/\s/g, '').includes(search),
      );

      filterUsers.forEach((user) => {
        this.autocompleteUsersList.push(user);
      });
    } else this.autocompleteShow = false;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
