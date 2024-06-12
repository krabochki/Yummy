import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { heightAnim, modal } from 'src/tools/animations';
import { IUser, nullUser } from '../../models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import {
  Permission,
  managersPreferences,
  sections,
  social,
  steps,
  stepsIcons,
} from './conts';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  finalize,
  takeUntil,
  tap,
} from 'rxjs';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { ThemeService } from 'src/app/modules/common-pages/services/theme.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { passMask } from 'src/tools/regex';
import { customPatternValidator } from 'src/tools/validators';
import { AchievementService } from 'src/app/modules/authentication/components/control-dashboard/achievements/services/achievement.service';
import { IAchievement, loadingAchievement } from 'src/app/modules/authentication/components/control-dashboard/achievements/models/achievement';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() user: IUser = { ...nullUser };
  permissionNotificationSections = sections;
  managersPreferences = managersPreferences;
  stepsIcons = stepsIcons;

  protected exitModalShow: boolean = false;

  protected location: string = '';

  protected socials: social[] = ['email', 'telegram', 'vk', 'viber','twitter', 'facebook'];

  protected steps = steps;
  protected step: number = 0;

  private destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();

  form: FormGroup;
  currentUser: IUser = nullUser;
  errorModal = false;
  errorText = '';

  loading = false;

  

  get passwordNotValidError() {
    return this.form.get('password')?.invalid &&
      (this.form.get('password')?.dirty || this.form.get('password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква английского алфавита'
      : '';
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private notifyService: NotificationService,
    private themeService: ThemeService,
    private userService: UserService,
    private achievementService: AchievementService,
  ) {
    this.location = 'https://' + window.location.host;

    this.form = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          customPatternValidator(passMask),
        ],
      ],
    });
  }

  public ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((user) => {
          if (user.id !== this.currentUser.id && user.id) {
            this.subscriptions.add(
              this.userService
                .getLimitations()
                .pipe(
                  takeUntil(this.destroyed$),
                  tap((limitations) => {
                    this.currentUser.limitations = limitations;
                    this.authService.setCurrentUser(this.currentUser);
                  }),
                )
                .subscribe());
          }
          this.currentUser = user;
        }));

    addModalStyle(this.renderer);

  }

  achievements: IAchievement[] = [];
  clickNextStep(i: number) {
    const lastValue = this.step;
    this.step = i;
    if (i === 3 && lastValue !== i) {
      this.achievements = [];
      this.loadAchievements = true;

      this.loadFirstAchievements();

      //this.getAchievements()
    }
  }

  getAchievementSource(achievement: IAchievement): Observable<any> | undefined {
    
    return this.achievementService.getAchievementByKind(
          achievement.kind,
          achievement.points,
        );

  }

  getAchievement(achievement: IAchievement) {
    if (achievement.isAchieved) return;
    achievement.loading = true;
    this.achievementService
      .achieve(achievement.id)
      .pipe(
        tap(() => {
          achievement.isAchieved = true;
          if (
            this.userService.getPermission(
              this.currentUser.limitations || [],
              Permission.NewAchievement,
            )
          ) {
                      const notify = this.notifyService.buildNotification(
                        'Новое достижение',
                        `Вы получили новое достижение «${achievement.title}»`,
                        'success',
                        'star',
                        '',
                      );
              this.notifyService
                .sendNotification(notify, this.currentUser.id, true)
                .subscribe();
          }

          achievement.loading = false;
        
          this.cd.markForCheck();
        }),
        catchError(() => {
          return EMPTY;
        }),
      )
      .subscribe();
  }
  loadAchievements = true;

  totalAchievements = 0;

  loadFirstAchievements() {
    this.loadAchievements = true;
    this.pushPreloaders(10);
    this.subscriptions.add(
      this.achievementService
        .getSomeUserAchievements(0, 10)
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.achievements = data.achievements;
          this.loadAchievementsInfo(this.achievements);
          this.totalAchievements = data.total;
          this.loadAchievements = false;
          this.filterPreloader();
          this.cd.markForCheck();
        }));
  }

  filterPreloader() {
    this.achievements = this.achievements.filter((n) => n.id);
    this.cd.markForCheck();
  }

  pushPreloaders(n: number) {

     for (let index = 0; index < n; index++) {
       this.achievements.push(loadingAchievement);
     }
     this.cd.markForCheck();
  }

  onScroll(event: any) {
    const element = event.target;
    const atBottom =
      element.scrollHeight - element.scrollTop - 2 <= element.clientHeight;

    if (
      atBottom &&
      !this.loading &&
      this.achievements.length < this.totalAchievements
    ) {
      this.loadAchievements = true;
      const offset = this.achievements.length;
      const limit = 10;

      const waitingForLoading =
        this.totalAchievements - this.achievements.length;
      this.pushPreloaders(waitingForLoading < 10 ? waitingForLoading : 10);
      setTimeout(() => {
        this.subscriptions.add(
          this.achievementService
            .getSomeUserAchievements(offset, limit)
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data) => {
              this.achievements = this.achievements.concat(data.achievements);
              this.loadAchievementsInfo(data.achievements);

              this.loadAchievements = false;
              this.filterPreloader();
              this.cd.markForCheck();
            }),
        );
      }, 300);

      // Прокрутка достигла нижнего края, загружаем дополнительные уведомления
    }
  }
  offset = 0;
  limit = 6;


  loadIcon(achievement: IAchievement) {
    if (achievement.iconPath) {

      this.subscriptions.add(
        this.achievementService
          .downloadImage(achievement.iconPath)
          .pipe(
            takeUntil(this.destroyed$),
            tap((blob) => {
              if (blob) {
                achievement.iconUrl = URL.createObjectURL(blob);
                this.cd.markForCheck();
              }
            }),
            catchError(() => {
              return EMPTY;
            }),
          )
          .subscribe());
    }
  }
  loadAchievementsInfo(achievements: IAchievement[]) {
    achievements.forEach((achievement) => {
            achievement.loading = true;

        this.loadIcon(achievement)
      
      const source = this.getAchievementSource(achievement);
      if (source && !achievement.isAchieved) {
        this.subscriptions.add(
          source.pipe(takeUntil(this.destroyed$)).subscribe((response) => {
            achievement.loading = false;
            achievement.progress = response.progress;
            achievement.completionPercentage = response.completionPercentage;
            achievement.isScoreExceeded = response.isScoreExceeded;
            this.cd.markForCheck();
          }));
      }
      else {
        achievement.loading = false;
      }
    });
  }

  getAchievements() {
    this.subscriptions.add(
    this.achievementService
        .getUserAchievements()
        .pipe(takeUntil(this.destroyed$))
      .subscribe((achievements: IAchievement[]) => {
        achievements.map((a: IAchievement) => (a.loading = true));
        this.loadAchievements = false;

        this.achievements = achievements;
        this.cd.markForCheck();

        achievements.forEach((achievement: IAchievement) => {
          
          this.loadIcon(achievement);
          const source = this.getAchievementSource(achievement);
          if (source && !achievement.isAchieved) {
            this.subscriptions.add(source
              .pipe(takeUntil(this.destroyed$))
              .subscribe((response) => {
              achievement.loading = false;
              achievement.progress = response.progress;
              achievement.completionPercentage = response.completionPercentage;
              achievement.isScoreExceeded = response.isScoreExceeded;
              this.cd.markForCheck();
            }));
          }
        });
      }))
  }

  titleForPercents(achievement: IAchievement) {
    if (achievement.isAchieved || achievement.isScoreExceeded) return '';

    return `${achievement.progress}/${achievement.points}`;
  }
  showBlock(i: number) {
    if (this.user.role === 'user' && i === 4) return false;
    return true;
  }


  protected nightModeEmit() {
    this.themeService.changeTheme();
  } //переключ темной темы

  protected userPermissionEnabled(context: Permission): boolean {
    //разрешены ли конкретные уведомления
    //если уведов нет или оно не установлено то считаю что можно
    if (this.currentUser.limitations) {
      const findedLimitation = this.currentUser.limitations?.find(
        (p) => p === context,
      );
      if (findedLimitation) return false;
    }

    return true;
  }

  protected tooglePermission(
    //изменение значения разрешения на уведомления
    context: Permission,
  ): void {
    const limitation = this.currentUser.limitations?.find((p) => p === context);
    if (limitation) {
      this.loading = true;
      this.userService
        .deleteLimitation(context)
        .pipe(
          tap(() => {
            this.currentUser.limitations = this.currentUser.limitations?.filter(
              (l) => l !== limitation,
            );
          }),
          finalize(() => {
            this.loading = false;
            this.addModalStyle();
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    } else {
      this.userService
        .postLimitation(context)
        .pipe(
          tap(() => {
            this.currentUser.limitations?.push(context);
          }),
          finalize(() => {
            this.loading = false;
            this.addModalStyle();
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  async handleExitModal(event: boolean) {
    this.exitModalShow = false;
    if (event) {
      this.loading = true;
      this.authService.logout().subscribe(() => {
        this.authService.setCurrentUser(nullUser);
        this.loading = false;
        this.router.navigateByUrl('/');
      });
    } else {
      addModalStyle(this.renderer);
    }
  }

  addModalStyle() {
    addModalStyle(this.renderer);
  }


  protected clickBackgroundNotContent(elem: Event): void {
    //обработка нажатия на фон настроек, но не на блок с настройками
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  //cкрытие/добавление прокрутки к основному содержимому

  public ngOnDestroy(): void {
    removeModalStyle(this.renderer);
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }
}
