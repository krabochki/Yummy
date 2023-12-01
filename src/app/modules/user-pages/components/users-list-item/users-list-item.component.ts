import {
  ChangeDetectionStrategy,
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
import { Subject, takeUntil } from 'rxjs';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { EmojiData } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { supabase } from 'src/app/modules/controls/image/supabase-data';

@Component({
  selector: 'app-users-list-item',
  templateUrl: './users-list-item.component.html',
  styleUrls: ['./users-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal())],
})
export class UsersListItemComponent implements OnInit, OnDestroy {
  @Input() public userId: number = 0;
  user: IUser = { ...nullUser };
  @Output() demoteClick = new EventEmitter<IUser>();
  emoji: EmojiData | null = null;
  noAvatar = '/assets/images/userpic.png';
  avatar: string = '';
  noAccessModalShow = false;

  private destroyed$: Subject<void> = new Subject<void>();
  followingLength: number = 0;
  followersLength: number = 0;
  @Input() adminpanel = false;
  userRecipesLength: number = 0;
  isFollower: boolean = false;
  currentUser: IUser = { ...nullUser };
  allRecipes:IRecipe[] =[]
  constructor(
    private userService: UserService,
    private recipeService: RecipeService,
    private authService: AuthService,
    private notifyService: NotificationService,
    private cd: ChangeDetectorRef,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IRecipe[]) => {
        this.allRecipes = data;
        
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
        this.userService.users$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((data: IUser[]) => {
            const users: IUser[] = data;
            this.user = users.find((u) => u.id === this.userId) || nullUser;
            this.followingLength = this.userService.getFollowing(
              users,
              this.user.id,
            ).length;
            this.followersLength = this.userService
              .getFollowers(users, this.user.id)
              .filter((f) => f.id !== 0).length;
            this.emoji = this.user.emojiStatus ? this.user.emojiStatus : null;

            const currentUserInFollowers = this.user.followersIds.find(
              (followerId: number) => followerId === this.currentUser.id,
            );
            currentUserInFollowers
              ? (this.isFollower = true)
              : (this.isFollower = false);
            if (this.user.avatarUrl) {
              this.downloadUserpicFromSupabase(this.user.avatarUrl);
            }
            this.userRecipesLength = this.recipeService.getRecipesByUser(
              this.allRecipes,
              this.user.id,
            ).length;
            this.cd.markForCheck();
          });
      });
  }

  protected demote() {
    this.demoteClick.emit(this.user);
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  downloadUserpicFromSupabase(path: string) {
    this.avatar = supabase.storage
      .from('userpics')
      .getPublicUrl(path).data.publicUrl;
  }

  clickFollowButton() {
    if (this.currentUser.id > 0) {
      !this.isFollower ? this.follow() : this.unfollow();
    } else {
      this.noAccessModalShow = true;
    }
  }

  showStatus(user: IUser) {
    return this.userService.getPermission('show-status', user);
  }

  async updateUser(user:IUser) {
   await this.userService.updateUserInSupabase(user); 
  }

  async follow() {
    if (this.currentUser.id > 0) {
      this.user = this.userService.addFollower(this.user, this.currentUser.id);
       this.updateUser(this.user);
       if (this.userService.getPermission('new-follower', this.user)) {
        const notify: INotification = this.notifyService.buildNotification(
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
        this.notifyService.sendNotification(notify, this.user)
      }
    }
  }

  async unfollow() {
    if (this.currentUser.id > 0) {
      this.user = this.userService.removeFollower(
        this.user,
        this.currentUser.id,
      );
       this.updateUser(this.user);
    }
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
