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
import {
  Title,
} from '@angular/platform-browser';
import { Location, registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { ChangeDetectionStrategy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { formatRussianDate, getFormattedDate, getZodiacSign } from 'src/tools/common';
import { customEmojis, emojisRuLocale, zodiacIcons } from './emoji-picker-data';
import { EmojiData } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { supabase } from 'src/app/modules/controls/image/supabase-data';

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
  avatar: string = '';

  emojisRuLocale = emojisRuLocale;
  customEmojis = customEmojis;
  selectedEmoji: EmojiData | null = null; //эмодзи статус текущего пользователя
  showEmojiPicker: boolean = false; //показывается ли окно выбор смайликов

  hireModalShow = false;
  hireSuccessModalShow = false;
  editModalShow: boolean = false;
  noAccessModalShow: boolean = false;

  linkForSocials: string = '';

  settingsShow = false;
  dataLoaded = false;
  userpicLoaded = true;
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

  get noPageToGoBack() {
    return window.history.length <= 1;
  }

  get showHireButton() {
    return this.userService.getPermission('new-moder-button', this.currentUser);
  }

  protected get validRegistrationDate(): string {
    return getFormattedDate(this.user.registrationDate);
  }

  get isSameUser(): boolean {
    return this.currentUser.id === this.user.id;
  }

  get showRole(): boolean {
    if (this.myPage) return true;
    if (this.currentUser.role === 'admin') return true;
    return this.userService.getPermission('show-status', this.user);
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
    private location: Location,
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
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.currentUser = { ...data };

        this.route.data.subscribe((data: Data) => {
          if (!this.moreInfoEnabled) {
            this.recipesEnabled = true;
            this.moreInfoEnabled = false;
          }
          this.user = data['user'];

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
                this.user.fullName
                  ? this.user.fullName
                  : '@' + this.user.username,
              );

              if (this.currentUser.id === this.user.id) {
                //this.currentUser = this.user;
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

                  if (this.user.avatarUrl) {
                    this.downloadUserpicFromSupabase(this.user.avatarUrl);
                  } else {
                    this.avatar = '';
                  }

                  if (
                    this.userService.getPermission('hide-author', this.user) ||
                    this.currentUser.id === this.user.id ||
                    (this.currentUser.role === 'moderator' &&
                      this.user.role !== 'admin') ||
                    this.currentUser.role === 'admin'
                  ) {
                    this.userRecipes = this.recipeService.getRecipesByUser(
                      this.allRecipes,
                      this.user.id,
                    );
                    this.userPublicRecipes =
                      this.recipeService.getPublicRecipes(this.userRecipes);
                  } else {
                    this.userRecipes = [];
                    this.userPublicRecipes = [];
                  }

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

                  if (this.userRecipes.length === 0 ) {
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
          this.cd.markForCheck();
        });
      });

    if (!this.myPage) {
      this.user.profileViews++;
      this.updateUser(this.user);
    }
  }

  goBack() {
    this.location.back();
  }

  get zodiacIcon() {
    const zodiac = this.zodiacSign;
    return zodiacIcons.find(i => i.zodiac === zodiac)?.icon || '';
  }

  get birthday() {
    return formatRussianDate(new Date(this.user.birthday));
  }
  get zodiacSign() {
    return getZodiacSign(new Date(this.user.birthday));
  }

  closeFollows() {
    this.showFollows = false;
  }

  downloadUserpicFromSupabase(path: string) {
    this.avatar = supabase.storage
      .from('userpics')
      .getPublicUrl(path).data.publicUrl;
    this.cd.markForCheck();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settingsClose(event: boolean) {
    this.settingsShow = false;
  }

  //подписка текущего пользователя на людей в списке
  async follow() {
    
    if (!this.loading) {
      this.loading = true;

      if (this.currentUser.id > 0) {
        const followedUser = this.userService.addFollower({ ...this.user }, this.currentUser.id);
        await this.updateUser({ ...followedUser });
        if (this.userService.getPermission('new-follower', followedUser)) {
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
          await this.notifyService.sendNotification(notify, followedUser);
        }
      } this.loading = false;
      this.cd.markForCheck();
    }

  }

  loading = false;

  async unfollow() {
    if (!this.loading) {
      this.loading = true;
      if (this.currentUser.id > 0) {
        const unfollowedUser = this.userService.removeFollower(
          { ...this.user },
          this.currentUser.id,
        );
        await this.updateUser({...unfollowedUser});
      }
      this.loading = false;
      this.cd.markForCheck();
    }
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
      this.updateUser(this.currentUser);
      this.notifyService.sendNotification(notify, this.user);
      this.hireSuccessModalShow = true;
    }
    this.hireModalShow = false;
  }
  protected handleSuccessHireModal() {
    this.hireSuccessModalShow = false;
  }

  isButtonDisabled = false;

  protected setEmoji(event: any): void {
    const emoji = event.emoji;
    if (emoji.id !== this.selectedEmoji?.id) {
      this.selectedEmoji = emoji;
      this.currentUser.emojiStatus = emoji;
      this.updateUser(this.currentUser);
    }
    this.showEmojiPicker = false;
  }

  async updateUser(user: IUser) {
    await this.userService.updateUserInSupabase({...user});
  }
  protected unsetEmoji($event: any): void {
    $event.stopPropagation();
    $event.preventDefault();
    if (this.selectedEmoji) {
      this.currentUser.emojiStatus = undefined;
      this.updateUser(this.currentUser);
      this.selectedEmoji = null;
      this.showEmojiPicker = false;
    }
  }

  userButtonClick() {

    if (!this.loading) {
      if (this.currentUser.id === 0) {
        this.noAccessModalShow = true;
      }
      else {
        if (this.myPage) {
          this.edit();
        }
        else {
          if (this.userService.isUserSubscriber(this.user, this.currentUser.id)) {
            this.unfollow();
          }
          else {
            this.follow();
          }
        }
      }
       
    
    }
  }

  openEmojiPicker() {
    if (this.isSameUser) this.showEmojiPicker = !this.showEmojiPicker;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
