import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from '../../models/users';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { fadeIn, heightAnim, modal } from 'src/tools/animations';
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
import { customEmojis, emojisRuLocale } from './emoji-picker-data';
import { EmojiData } from '@ctrl/ngx-emoji-mart/ngx-emoji';

@Component({
  selector: 'app-user-page',
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss', './skeleton.scss'],
  animations: [
    trigger('fadeIn', fadeIn()),
    trigger('modal', modal()),
    trigger('height', heightAnim()),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPageComponent implements OnInit, OnDestroy {

  protected emojisRuLocale = emojisRuLocale;
  protected customEmojis = customEmojis;
  protected selectedEmoji: EmojiData | null = null; //эмодзи статус текущего пользователя
  protected showEmojiPicker: boolean = false; //показывается ли окно выбор смайликов

  hireModalShow = false;
  hireSuccessModalShow = false;
  editModalShow: boolean = false;
  noAccessModalShow: boolean = false;

  linkForSocials: string = '';

  settingsShow = false;
  dataLoaded = false;
  showFollows = false;
  recipesEnabled: boolean = true;
  moreInfoEnabled: boolean = false;
  obj: 'following' | 'followers' = 'followers';

  userFollowers: IUser[] = [];
  userFollowing: IUser[] = [];

  myPage: boolean = false;

  likes: number = 0;
  cooks: number = 0;
  comments: number = 0;
  users: IUser[] = [];
  currentUser: IUser = { ...nullUser };
  user: IUser = { ...nullUser };
  allRecipes: IRecipe[] = [];
  userRecipes: IRecipe[] = [];
  userPublicRecipes: IRecipe[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  @ViewChild('emojiPicker') emojiPicker?: ElementRef;

  get showHireButton() {
    return this.userService.getPermission('new-moder-button',this.currentUser)
  }

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
    private renderer: Renderer2,
  ) {
    registerLocaleData(localeRu);
    this.linkForSocials = window.location.href;

    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.emojiPicker) {
        if (!this.emojiPicker.nativeElement.contains(e.target)) {
          this.showEmojiPicker = false;
          this.cd.markForCheck();
        }
      }
    });
  }

  ngOnInit() {
    this.route.data.subscribe((data: Data) => {
      this.recipesEnabled = true;
      this.moreInfoEnabled = false;
      this.user = data['user'];

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

      this.userService.users$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.users = data;
          const findedUser = data.find((user) => user.id === this.user.id);

          if (findedUser) {
            this.user = findedUser;
          }
          this.selectedEmoji = this.user.emojiStatus
            ? this.user.emojiStatus
            : null;

          this.titleService.setTitle(
            this.user.fullName ? this.user.fullName : '@' + this.user.username,
          );

          if (this.currentUser.id === this.user.id) {
            this.currentUser = this.user;
            this.myPage = true;
          }

          this.userFollowers = this.userService.getFollowers(
            data,
            this.user.id,
          );

          this.userFollowing = this.userService.getFollowing(
            data,
            this.user.id,
          );

          this.recipeService.recipes$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data) => {
              this.allRecipes = this.recipeService.getPopularRecipes(data);

              this.userRecipes = this.recipeService.getRecipesByUser(
                this.allRecipes,
                this.user.id,
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

              if (this.userRecipes.length === 0) {
                this.moreInfoEnabled = true;
                this.recipesEnabled = false;
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

  onSkipHandler() {
    this.router.navigate([this.routerEventsService.previousRoutePath.value]);
  }

  closeFollows() {
    this.showFollows = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settingsClose(event: boolean) {
    this.settingsShow = false;
  }

  //подписка текущего пользователя на людей в списке
  follow() {
    this.user = this.userService.addFollower(this.user, this.currentUser.id);
    this.userService.updateUsers(this.user).subscribe(() => {
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
        this.notifyService.sendNotification(notify, this.user).subscribe();
      }
    });
  }

  unfollow() {
    this.user = this.userService.removeFollower(this.user, this.currentUser.id);
    this.userService.updateUsers(this.user).subscribe();
  }

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

  protected setEmoji(event: any): void {
    const emoji = event.emoji;
    if (emoji.id !== this.selectedEmoji?.id) {
      this.selectedEmoji = emoji;
      this.currentUser.emojiStatus = emoji;
      this.userService.updateUsers(this.currentUser).subscribe();
    }
    this.showEmojiPicker = false;
  }
  protected unsetEmoji(): void {
    this.currentUser.emojiStatus = undefined;
    this.userService.updateUsers(this.currentUser).subscribe();
    this.selectedEmoji = null;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
