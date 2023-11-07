import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IUser, nullUser } from '../../models/users';
import { UserService } from '../../services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-users-list-item',
  templateUrl: './users-list-item.component.html',
  styleUrls: ['./users-list-item.component.scss'],
})
export class UsersListItemComponent implements OnInit, OnDestroy {
  @Input() public user: IUser = { ...nullUser };
  @Output() demoteClick = new EventEmitter<IUser>();

  private destroyed$: Subject<void> = new Subject<void>();
  followingLength: number = 0;
  @Input() adminpanel = false;
  userRecipesLength: number = 0;
  isFollower: boolean = false;
  currentUser: IUser = {...nullUser};

  constructor(
    private userService: UserService,
    private recipeService: RecipeService,
    private authService: AuthService,
  ) {}

  public ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
        const currentUserInFollowers = this.user.followersIds.find(
          (followerId: number) => followerId === data.id,
        );
        currentUserInFollowers
          ? (this.isFollower = true)
          : (this.isFollower = false);
      });
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser[]) => {
        const users: IUser[] = data;
        this.followingLength = this.userService.getFollowing(
          users,
          this.user.id,
        ).length;
      });

    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IRecipe[]) => {
        const recipes: IRecipe[] = data;
        this.userRecipesLength = this.recipeService.getRecipesByUser(
          recipes,
          this.user.id,
        ).length;
      });
  }

  protected demote() {
    this.demoteClick.emit(this.user);
  }

  protected follow(): void {
    this.user = this.userService.addFollower(this.user, this.currentUser.id);
    this.userService.updateUsers(this.user).subscribe()
  }

  protected unfollow(): void {
    this.user = this.userService.removeFollower(this.user, this.currentUser.id);
    this.userService.updateUsers(this.user).subscribe();
  }
  

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
