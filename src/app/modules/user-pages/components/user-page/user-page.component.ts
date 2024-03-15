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
import { Location, registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subject, finalize, forkJoin, takeUntil, tap } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import {
  formatRussianDate,
  getFormattedDate,
  getZodiacSign,
} from 'src/tools/common';
import { customEmojis, emojisRuLocale, zodiacIcons } from './emoji-picker-data';
import { Emoji, EmojiData } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { Permission } from '../settings/conts';

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
  emojisRuLocale = emojisRuLocale;
  customEmojis = customEmojis;

  startImageToView = 0;

  showedImages:string[] = [];

  hireModalShow = false;
  hireSuccessModalShow = false;
  editModalShow: boolean = false;
  noAccessModalShow: boolean = false;
  settingsShow = false;
  linkForSocials: string = '';
  showFollows = false;
  recipesEnabled: boolean = true;
  moreInfoEnabled: boolean = false;
  obj: 'following' | 'followers' = 'followers';
  showEmojiPicker: boolean = false; //показывается ли окно выбор смайликов
  ///

  avatar: string = '';
  selectedEmoji: EmojiData | null = null; //эмодзи статус текущего пользователя

  dataLoaded = false;
  myPage: boolean = false;

  recipesStatistics: { likes: number; cooks: number; comments: number } = {
    likes: 0,
    cooks: 0,
    comments: 0,
  };
  userStatistics: {
    followers: number;
    followings: number;
    recipes: number;
    follower: number;
  } = {
    followers: 0,
    followings: 0,
    recipes: 0,
    follower: 0,
  };
  users: IUser[] = [];
  currentUser: IUser = { ...nullUser };
  user: IUser = { ...nullUser };
  userRecipes: IRecipe[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  @ViewChild('emojiPicker') emojiPicker?: ElementRef;

  get noPageToGoBack() {
    return window.history.length <= 1;
  }

  get publicRecipesLength() {
    return this.userRecipes.filter((r) => r.status === 'public').length;
  }

  get showHireButton() {
    return this.userService.getPermission(
      this.currentUser.limitations || [],
      Permission.HiringButton,
    );
  }

  protected get validRegistrationDate(): string {
    return getFormattedDate(this.user.registrationDate);
  }

  get isSameUser(): boolean {
    return this.currentUser.id === this.user.id;
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
    const screenWidth = window.innerWidth;

    if (screenWidth <= 900) {
      this.recipesPerStep = 2;
    }
    registerLocaleData(localeRu);

    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.emojiPicker) {
        if (!this.emojiPicker.nativeElement.contains(e.target)) {
          this.showEmojiPicker = false;
          this.cd.markForCheck();
        }
      }
    });
  }

  currentUserId = 0;

  updateUserInfo() {
    this.route.data.subscribe((data: Data) => {
      this.avatar = '';
      this.userService.setUsers([]);
      this.recipeService.setRecipes([]);
      this.userRecipes = [];
      this.currentStep = 0;
      this.recipesLoaded = true;
      this.allRecipesLoaded = false;
      this.recipesEnabled = true;
      this.moreInfoEnabled = false;

      this.authService.getTokenUser().subscribe((user) => {
        this.currentUserId = user.id;
        this.user = data['user'];

        if (this.user.id === this.currentUserId) {
          this.myPage = true;
        } else {
          this.myPage = false;
        }

        this.addProfileView();

        this.userService.getInfoForUserpage(this.user.id).subscribe((user) => {
          this.user = user;
          this.linkForSocials = window.location.href;
          this.selectedEmoji = user.emoji;
          this.cd.markForCheck();
          this.titleService.setTitle(user.fullName || `@${user.username}`);

          const subscribes$: Observable<any>[] = [];

          subscribes$.push(
            this.userService
              .getUserStatistics(this.user.id, this.currentUserId)
              .pipe(
                tap((statistics) => {
                  this.userStatistics = statistics;
                  if (this.userStatistics.follower) {
                    this.user.followersIds = this.user.followersIds || [];
                    this.user.followersIds.push(this.currentUser.id);
                  }
                  if (statistics.recipes === 0) {
                    this.moreInfoEnabled = true;
                    this.recipesEnabled = false;
                  }
                }),
              ),
          );
          subscribes$.push(
            this.userService.getUserRecipesStatistics(this.user.id).pipe(
              tap((statistics) => {
                this.recipesStatistics = statistics;
              }),
            ),
          );

          forkJoin(subscribes$).subscribe(() => {
            this.dataLoaded = true;

            this.cd.markForCheck();

            if (this.user.image) {
              this.user.loadingImage = true;
              this.userService
                .downloadUserpic(this.user.image)
                .pipe(
                  tap((blob) => {
                    this.user.avatarUrl = URL.createObjectURL(blob);
                    this.avatar = this.user.avatarUrl;
                    this.cd.markForCheck();
                  }),
                  finalize(() => {
                    this.user.loadingImage = false;
                  }),
                )
                .subscribe();
            }
          });

          this.startRecipesLoad();
        });

        if (!this.moreInfoEnabled) {
          this.recipesEnabled = true;
          this.moreInfoEnabled = false;
        }
      });

      this.cd.markForCheck();
    });
  }

  viewAvatar() {
    if (this.user.avatarUrl) {
      this.startImageToView = 0;
      this.showedImages = [this.user.avatarUrl];
    }
  }

  currentStep = 0;
  recipesPerStep = 3;
  allRecipesLoaded = false;
  recipesLoaded = true;

  startRecipesLoad() {
    this.currentStep = 0;
    this.allRecipesLoaded = false;
    this.userRecipes = [];
    this.recipeService.setRecipes([]);
    this.loadMoreRecipes();
  }

  loadMoreRecipes() {
    if (this.recipesLoaded) {
      this.recipesLoaded = false;

      setTimeout(() => {
        this.recipeService
          .getSomeRecipesForUserpage(
            this.recipesPerStep,
            this.currentStep,
            this.user.id,
            this.currentUserId,
          )
          .subscribe((res) => {
            const count = res.count;
            const newRecipes = res.recipes;

            const actualRecipes = newRecipes.filter(
              (newRecipe) =>
                !this.userRecipes.some(
                  (existingRecipe) => existingRecipe.id === newRecipe.id,
                ),
            );

            if (!actualRecipes.length) {
              this.recipesLoaded = true;
              this.allRecipesLoaded = true;
            }

            actualRecipes.forEach((recipe) => {
              this.recipeService.getRecipeImage(recipe);
              recipe = this.recipeService.translateRecipe(recipe);
              this.recipeService.addNewRecipe(recipe);
            });
            this.userRecipes = [...this.userRecipes, ...actualRecipes];
            if (count <= this.userRecipes.length) {
              this.allRecipesLoaded = true;
            } else {
              this.currentStep++;
            }
            this.recipesLoaded = true;

            this.cd.markForCheck();
          });
      }, 300);
    }
  }

  initRecipes() {
    this.recipeService.recipes$.subscribe((recipes) => {
      this.userRecipes.forEach((recipe) => {
        const findedRecipe = recipes.find((r) => r.id === recipe.id);
        recipe = findedRecipe || recipe;
      });
      this.cd.markForCheck();
    });
  }

  changeFollowings($event: any) {
    if ($event) {
      this.userStatistics.followings = $event;
    }
  }
  initCurrentUser() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.currentUser = { ...data };
        this.cd.markForCheck();
      });
  }
  addProfileView() {
    if (!this.myPage) {
      this.userService
        .incrementProfileViews(this.user.id)
        .pipe(
          tap(() => {
            const updatedUser: IUser = {
              ...this.user,
              profileViews: this.user.profileViews++,
            };
            this.userService.updateUserInUsers(updatedUser);
          }),
          finalize(() => {}),
        )
        .subscribe();
    }
  }

  ngOnInit() {
    this.initRecipes();
    this.initCurrentUser();

    this.updateUserInfo();
  }

  goBack() {
    this.location.back();
  }

  get zodiacIcon() {
    const zodiac = this.zodiacSign;
    return zodiacIcons.find((i) => i.zodiac === zodiac)?.icon || '';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settingsClose(event: boolean) {
    this.settingsShow = false;
  }

  //подписка текущего пользователя на людей в списке
  follow() {
    if (this.currentUser.id > 0) {
      this.userService.followUser(this.currentUser.id, this.user.id).subscribe({
        next: () => {
          this.user.followersIds = this.user.followersIds || [];
          this.user.followersIds.push(this.currentUser.id);
          this.userStatistics.followers++;
          this.cd.markForCheck();
        },
      });

      // if (this.userService.getPermission('new-follower', this.user)) {
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
      this.notifyService.sendNotification(notify, this.user.id).subscribe();
    }
    this.cd.markForCheck();
  }

  async unfollow() {
    if (this.currentUser.id > 0) {
      this.userService
        .unfollowUser(this.currentUser.id, this.user.id)
        .subscribe({
          next: () => {
            this.user.followersIds = this.user.followersIds || [];

            this.user.followersIds = this.user.followersIds.filter(
              (fId) => fId !== this.currentUser.id,
            );
            this.userStatistics.followers--;
            this.cd.markForCheck();
          },
        });
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
      this.userService
        .updateUserProperty(this.user.id, 'role', 'moderator')
        .pipe(
          tap(() => {
            const updatedUser: IUser = {
              ...this.user,
              role: 'moderator',
            };
            this.userService.updateUserInUsers(updatedUser);
            const notify: INotification = this.notifyService.buildNotification(
              'Вас назначили модератором',
              `Вы теперь являетесь модератором сайта Yummy. Ознакомиться с функциями модераторов можно в панели модератора.`,
              'info',
              'hire',
              `/cooks/list/${this.currentUser.id}`,
            );

            const notifyForAdmin: INotification =
              this.notifyService.buildNotification(
                'Вы назначили модератора',
                `Вы успешно назначили нового модератора сайта Yummy @${
                  this.user.username
                }${this.user.fullName ? ` (${this.user.fullName})` : ''}`,
                'success',
                'manager',
                `/cooks/list/${this.user.id}`,
              );

            this.user.role = 'moderator';

            this.cd.markForCheck();

            this.notifyService
              .sendNotification(notify, this.user.id)
              .subscribe();
            this.notifyService
              .sendNotification(notifyForAdmin, this.currentUser.id, true)
              .subscribe();
          }),
          finalize(() => {}),
        )
        .subscribe();

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
      if (this.currentUser.id > 0) {
        this.userService
          .updateUserProperty(
            this.currentUserId,
            'emoji',
            JSON.stringify(emoji),
          )
          .subscribe(() => {
            this.user.emoji = emoji;
            this.selectedEmoji = emoji;
            this.cd.markForCheck();
          });
      }
    }
    this.showEmojiPicker = false;
  }

  protected unsetEmoji($event: any): void {
    $event.stopPropagation();
    $event.preventDefault();
    if (this.selectedEmoji) {
      this.currentUser.emoji = undefined;

      const findedCurrentUser: IUser =
        this.users.find((user) => user.id === this.currentUser.id) || nullUser;
      if (this.currentUser.id > 0) {
        const updatedUser: IUser = {
          ...findedCurrentUser,
          emoji: null,
        };

        this.userService
          .updateUserProperty(this.currentUser.id, 'emoji', null)
          .subscribe(() => this.userService.updateUserInUsers(updatedUser));
        this.selectedEmoji = null;
        this.showEmojiPicker = false;
      }
    }
  }

  userButtonClick() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
    } else {
      if (this.myPage) {
        this.edit();
      } else {
        if (this.userService.isUserSubscriber(this.user, this.currentUser.id)) {
          this.unfollow();
        } else {
          this.follow();
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
