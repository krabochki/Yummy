import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from '../../models/users';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { fadeIn, modal } from 'src/tools/animations';
import { trigger } from '@angular/animations';
import { Title } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { RouteEventsService } from 'src/app/modules/controls/route-events.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { getFormattedDate } from 'src/tools/common';

@Component({
  selector: 'app-user-page',
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss', './skeleton.scss'],
  animations: [trigger('fadeIn', fadeIn()), trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPageComponent implements OnInit, OnDestroy {
  recipesEnabled: boolean = true;
  moreInfoEnabled: boolean = false;
  obj: 'following' | 'followers' = 'followers';
  dataLoaded = false;
  showFollows = false;

  closeFollows() {
    this.showFollows = false;
  }

  linkForSocials: string = '';
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    public userService: UserService,
    private recipeService: RecipeService,
    private titleService: Title,
    public router: Router,
    private cd: ChangeDetectorRef,
    private notifyService: NotificationService,
    public routerEventsService: RouteEventsService,
  ) {
    registerLocaleData(localeRu);
    this.linkForSocials = window.location.href;
  }

  onSkipHandler() {
    this.router.navigate([this.routerEventsService.previousRoutePath.value]);
  }

  currentUser: IUser = { ...nullUser };
  settingsShow = false;

  user: IUser = { ...nullUser };

  editModalShow: boolean = false;
  noAccessModalShow: boolean = false;

  userId: number = 0;
  protected destroyed$: Subject<void> = new Subject<void>();

  userRecipes: IRecipe[] = [];
  userPublicRecipes: IRecipe[] = [];

  allRecipes: IRecipe[] = [];

  userFollowers: IUser[] = [];
  userFollowing: IUser[] = [];

  myPage: boolean = false;

  likes: number = 0;
  cooks: number = 0;
  comments: number = 0;
  users: IUser[] = [];
  ngOnInit() {
    this.route.data.subscribe((data: Data) => {
      this.recipesEnabled = true;
      this.moreInfoEnabled = false;
      this.user = data['user'];
      this.userId = this.user.id;

      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.currentUser = data;
        });

      if (this.currentUser.id === this.user.id) {
        this.myPage = true;
      } else {
        this.myPage = false;
      }

      this.userService.users$.pipe(takeUntil(this.destroyed$)).subscribe((data) => {
        this.users = data;
        const findedUser = data.find((user) => user.id === this.userId);

        if (findedUser) {
          this.user = findedUser;
        }

        this.titleService.setTitle(
          this.user.fullName ? this.user.fullName : '@' + this.user.username,
        );

        if (this.currentUser.id === this.user.id) {
          this.currentUser = this.user;
          this.myPage = true;
        }

        this.userFollowers = this.userService.getFollowers(data, this.userId);

        this.userFollowing = this.userService.getFollowing(data, this.userId);

        this.recipeService.recipes$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((data) => {
            this.allRecipes = this.recipeService.getPopularRecipes(data);

            this.userRecipes = this.recipeService.getRecipesByUser(
              this.allRecipes,
              this.userId,
            );
            this.userPublicRecipes = this.recipeService.getPublicRecipes(
              this.userRecipes,
            );

            if (
              !this.myPage &&
              (this.currentUser.role === 'admin' ||
                this.currentUser.role === 'moderator')
            ) {
              this.userRecipes = this.recipeService.getNotPrivateRecipes(
                this.userRecipes,
              );
            } else if (
              !this.myPage &&
              this.currentUser.role !== 'admin' &&
              this.currentUser.role !== 'moderator'
            ) {
              this.userRecipes = this.recipeService.getPublicRecipes(
                this.userRecipes,
              );
            }
            this.cooks = 0;
            this.likes = 0;
            this.comments = 0;
            this.userRecipes.forEach((recipe) => {
              this.cooks += recipe.cooksId?.length;
              this.likes += recipe.likesId?.length;
              this.comments += recipe.comments?.length;
              if (!this.cooks) this.cooks = 0;
              if (!this.likes) this.likes = 0;
              if (!this.comments) this.comments = 0;
            });

            this.cd.markForCheck();
            this.dataLoaded = true;
          });
      });
      if (!this.myPage) {
        this.user.profileViews++;
        this.userService.updateUsers(this.user).subscribe();
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settingsClose(event: boolean) {
    this.settingsShow = false;
  }

  //подписка текущего пользователя на людей в списке
  follow() {
    this.user = this.userService.addFollower(this.user, this.currentUser.id);
    this.userService.updateUsers(this.user).subscribe(() => {
      const author: IUser = this.user;
      const title =
        'Кулинар ' +
        (this.currentUser.fullName
          ? this.currentUser.fullName
          : '@' + this.currentUser.username) +
        ' подписался на тебя';

      const notify: INotification = this.notifyService.buildNotification(
        'Новый подписчик',
        title,
        'info',
        'user',
        '/cooks/list/' + this.currentUser.id,
      );
      this.notifyService.sendNotification(notify, author).subscribe();
    });
  }

  unfollow() {
    this.user = this.userService.removeFollower(this.user, this.currentUser.id);
    this.userService.updateUsers(this.user).subscribe();
  }

  username: string = 'username';

  edit() {
    this.editModalShow = !this.editModalShow;
  }

  closeEdit() {
    this.editModalShow = false;
  }
  updateCurrentUser(updatedUser: IUser) {
    this.user = updatedUser;
    this.closeEdit();
    this.cd.detectChanges();
  }

  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  protected get validRegistrationDate(): string {
    return getFormattedDate(this.user.registrationDate);
  }

  protected getName(user: IUser): string {
    return user.fullName ? user.fullName : '@' + user.username;
  }
  hireModalShow = false;
  hireSuccessModalShow = false;
  protected handleHireModal(answer: boolean) {
    if (answer) {
      this.user.role = 'moderator';
      const notify: INotification = this.notifyService.buildNotification(
        'Вас назначили модератором',
        `Вы теперь являетесь модератором сайта Yummy. Вас назначил администратор ${this.getName(
          this.currentUser,
        )}`,
        'info',
        'hire',
        `/cooks/list/${this.currentUser.id}`,
      );
      this.userService.updateUsers(this.user).subscribe();
      this.notifyService.sendNotification(notify, this.user).subscribe();
      this.hireSuccessModalShow = true;
    }
    this.hireModalShow = false;
  }
  protected handleSuccessHireModal() {
    this.hireSuccessModalShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
