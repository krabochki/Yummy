/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { EMPTY, Observable, Subject, Subscription, catchError, finalize, forkJoin, pipe, takeUntil, tap } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import {
  formatRussianDate,
  getFormattedDate,
  getZodiacSign,
} from 'src/tools/common';
import { customEmojis, emojisRuLocale, zodiacIcons } from './emoji-picker-data';
import {  EmojiData } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { Permission, social } from '../settings/conts';
import { AchievementService } from 'src/app/modules/authentication/components/control-dashboard/achievements/services/achievement.service';
import { IAchievement } from 'src/app/modules/authentication/components/control-dashboard/achievements/models/achievement';

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

  showedImages: string[] = [];

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
    achievements: number;
    follower: number;
  } = {
    followers: 0,
    followings: 0,
    recipes: 0,
    achievements: 0,
    follower: 0,
  };
  currentUser: IUser = { ...nullUser };
  user: IUser = { ...nullUser };
  userRecipes: IRecipe[] = [];
  
  subscriptions = new Subscription();
  protected destroyed$: Subject<void> = new Subject<void>();

  @ViewChild('emojiPicker') emojiPicker?: ElementRef;

  get noPageToGoBack() {
    return window.history.length <= 1;
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
    private achievementService: AchievementService,
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

  routeData: any = null;

  userAchievements: IAchievement[] = [];

  updateUserInfo() {
    this.avatar = '';
    this.dataLoaded = false;
    this.userRecipes = [];
    this.currentStep = 0;
    this.recipesLoaded = true;
    this.allRecipesLoaded = false;
    this.recipesEnabled = true;
    this.moreInfoEnabled = false;

    this.subscriptions.add(
      this.authService.getTokenUser().subscribe((user) => {
        this.currentUserId = user.id;
        this.user = this.routeData['user'];

        if (this.user.id === this.currentUserId) {
          this.myPage = true;
        } else {
          this.myPage = false;
        }

        this.addProfileView();

        this.userService.getInfoForUserpage(this.user.id)
          .pipe(takeUntil(this.destroyed$)).subscribe((user) => {
          this.user = user;
          if (user.image) this.user.loadingImage = true;
          this.linkForSocials = window.location.href;
          this.selectedEmoji = user.emoji;
          this.cd.markForCheck();
          this.titleService.setTitle(user.fullName || `@${user.username}`);

          const subscribes$: Observable<any>[] = [];

          subscribes$.push(
            this.userService.getUserStatistics(this.user.id).pipe(
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

          subscribes$.push(
            this.achievementService.getFirstUserAchievements(this.user.id).pipe(
              tap((achievements) => {
                this.userAchievements = achievements;
                this.loadAchievementImage(this.userAchievements);
              }),
            ),
          );
            this.subscriptions.add(

              forkJoin(subscribes$).pipe(takeUntil(this.destroyed$)).subscribe(() => {
                this.dataLoaded = true;

                this.cd.markForCheck();

                if (this.user.image) {
                  this.subscriptions.add(
                    this.userService
                      .downloadUserpic(this.user.image || '')
                      .pipe(
                        takeUntil(this.destroyed$),
                        tap((blob) => {
                          this.user.avatarUrl = URL.createObjectURL(blob);
                          this.avatar = this.user.avatarUrl;
                          this.cd.markForCheck();
                        }),
                        finalize(() => {
                          this.user.loadingImage = false;
                        }),
                      )
                      .subscribe());
                }
              }));

          this.startRecipesLoad();
        });

        if (!this.moreInfoEnabled) {
          this.recipesEnabled = true;
          this.moreInfoEnabled = false;
        }
      }));
  }

  currentAchievement: IAchievement|null = null;

  onMouseEnter(achievement: IAchievement): void {
    this.currentAchievement = achievement;
  }

  onMouseLeave(): void {
    this.currentAchievement = null;
  }

  viewAvatar() {
    if (this.user.avatarUrl) {
      this.startImageToView = 0;
      this.showedImages = [this.user.avatarUrl];
    }
  }

  loadAchievementImage(achievements: IAchievement[]) {
    achievements.forEach((ache) => {
      if (ache.iconPath) {
        ache.loading = true;
        this.subscriptions.add(
          this.achievementService
            .downloadImage(ache.iconPath)
            .pipe(
              takeUntil(this.destroyed$),
              finalize(() => {
                ache.loading = false;
                this.cd.markForCheck();
              }),
              tap((blob) => {
                if (blob) {
                  ache.iconUrl = URL.createObjectURL(blob);
                }
              }),
              catchError(() => {
                return EMPTY;
              }),
            )
            .subscribe());
      }
    });
  }

  currentStep = 0;
  recipesPerStep = 3;
  allRecipesLoaded = false;
  recipesLoaded = true;

  startRecipesLoad() {
    this.currentStep = 0;
    this.allRecipesLoaded = false;
    this.userRecipes = [];
    this.loadMoreRecipes();
  }

  loadMoreRecipes() {
    if (this.recipesLoaded) {
      this.recipesLoaded = false;

      this.subscriptions.add(

        this.recipeService
          .getSomeRecipesForUserpage(
            this.recipesPerStep,
            this.currentStep,
            this.user.id,
        )
          .pipe(takeUntil(this.destroyed$))
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

            this.loadRecipesImages(actualRecipes);

            this.userRecipes = [...this.userRecipes, ...actualRecipes];
            if (count <= this.userRecipes.length) {
              this.allRecipesLoaded = true;
            } else {
              this.currentStep++;
            }
            this.recipesLoaded = true;

            this.cd.markForCheck();
          }));
    }
  }

  private loadRecipesImages(recipes: IRecipe[]) {
    recipes.forEach((recipe) => {
      if (recipe.mainImage) {
        recipe.imageLoading = true;
        this.subscriptions.add(

          this.recipeService
            .downloadRecipeImage(recipe.mainImage)
            .pipe(
              takeUntil(this.destroyed$),
              tap((blob) => {
                recipe.imageURL = URL.createObjectURL(blob);
              }),
              finalize(() => {
                recipe.imageLoading = false;
                this.cd.markForCheck();
              }),
            )
            .subscribe());
      }
    });
  }

  changeFollowings($event: any) {
    if ($event) {
      this.userStatistics.followings++;
    } else {
      this.userStatistics.followings--;
    }
  }

  initCurrentUser() {
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.currentUser = { ...data };
          this.cd.markForCheck();
        }));
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
            this.user = updatedUser;
            this.cd.markForCheck();
          }),
          finalize(() => {}),
        )
        .subscribe();
    }
  }

  ngOnInit() {
    this.initCurrentUser();

    this.route.data.subscribe((data: Data) => {
      this.routeData = data;
      this.updateUserInfo();
    });
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

  protected socials: social[] = [
    'email',
    'telegram',
    'vk',
    'viber',
    'twitter',
    'facebook',
  ];

  //подписка текущего пользователя на людей в списке
  follow() {
    if (this.currentUser.id > 0) {
      this.userService.followUser(this.user.id).subscribe({
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

  unfollow() {
    if (this.currentUser.id > 0) {
      this.userService.unfollowUser(this.user.id).subscribe({
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
        .makeModerator(this.user.id)
        .pipe(
          tap(() => {
            const updatedUser: IUser = {
              ...this.user,
              role: 'moderator',
            };
            this.user = updatedUser;
            this.cd.markForCheck();
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
          .updateUserProperty('emoji', JSON.stringify(emoji))
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

      if (this.currentUser.id > 0) {
        const updatedUser: IUser = {
          ...this.user,
          emoji: null,
        };

        this.userService.updateUserProperty('emoji', null).subscribe(() => {
          this.user = updatedUser;
          this.cd.markForCheck();
        });
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
    this.subscriptions.unsubscribe();
  }
}
