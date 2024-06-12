import { ChangeDetectorRef, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { IAchievement } from '../models/achievement';
import { AchievementService } from '../services/achievement.service';
import { finalize, tap, catchError, EMPTY, Observable, concatMap, takeUntil, Subject, Subscription } from 'rxjs';
import {  removeModalStyle } from 'src/tools/common';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

@Component({
  selector: 'app-control-achievements',
  templateUrl: './control-achievements.component.html',
  styleUrls: [
    './control-achievements.component.scss',
    '../../control-dashboard.component.scss',
  ],
  animations: [trigger('modal', modal())],
})
export class ControlAchievementsComponent implements OnInit, OnDestroy {
  achievements: IAchievement[] = [];

  currentUser: IUser = nullUser;
  creatingMode = false;
  achievementsPerStep = 6;
  private currentStep = 0;
  everythingLoaded = false;
  loaded = false;

  preloader = Array.from({ length: this.achievementsPerStep }, (v, k) => k);
  countArVariants = ['раз', 'раза', 'раз'];
  protected destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private notifyService: NotificationService,
    private userService: UserService,
    private renderer: Renderer2,
    private achievementService: AchievementService,
  ) {}

  currentUserInitialize() {
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((receivedUser: IUser) => {
          this.currentUser = receivedUser;
        }));
  }

  ngOnInit(): void {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1080) {
      this.achievementsPerStep = 4;
      this.preloader = Array.from(
        { length: this.achievementsPerStep },
        (v, k) => k,
      );
    }

    this.checkActualAchievements();
    this.currentUserInitialize();
  }

  checkActualAchievements() {
    this.achievements = [];
    this.everythingLoaded = false;
    this.currentStep = 0;
    this.loadMoreAchievements(true);
  }

  loadMoreAchievements(checkUpdates?: boolean) {
    if (this.loaded || !this.achievements.length) {
      this.loaded = false;
      this.subscriptions.add(
        this.achievementService
          .getAchievements(this.achievementsPerStep, this.currentStep)
          .pipe(takeUntil(this.destroyed$))
          .subscribe((response: any) => {
            const newAchievements: IAchievement[] = response.results;
            const count = response.count;

            if (checkUpdates) {
              this.everythingLoaded = false;
              this.achievements = [];
            }
            const actualAchievements = newAchievements.filter(
              (newAchievement) =>
                !this.achievements.some(
                  (existing) => existing.id === newAchievement.id,
                ),
            );

            actualAchievements.forEach((ache) => {
              if (ache.iconPath) {
                ache.loading = true;
              this.subscriptions.add(  this.achievementService
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
                  .subscribe())
              }
            });

            if (actualAchievements.length > 0) {
              if (actualAchievements.length < 3) {
                this.everythingLoaded = true;
              }
              this.achievements = [...this.achievements, ...actualAchievements];
              this.currentStep++;
            } else {
              this.everythingLoaded = true;
            }
            if (count <= this.achievements.length) {
              this.everythingLoaded = true;
            }
            this.loaded = true;

            this.cd.markForCheck();
          }));
    }
  }

  closeCreatingMode() {
    this.creatingMode = false;
    removeModalStyle(this.renderer);
  }

  deleteAchievement(achievement: IAchievement) {
    this.loadingModal = true;

    const deleteAchievement$ = this.achievementService
      .deleteAchievement(achievement.id)
      .pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке удалить достижение.',
          );
          return EMPTY;
        }),
      );

    const deleteImage$: Observable<any> = this.achievementService
      .deleteIcon(achievement.id)
      .pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке удалить файл иконки удаляемого достижения.',
          );
          return EMPTY;
        }),
      );

    deleteImage$
      .pipe(
        concatMap(() => deleteAchievement$),
        finalize(() => {
          this.loadingModal = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successDeleteModal = true;
          this.checkActualAchievements();

          if (
            this.userService.getPermission(
              this.currentUser.limitations || [],
              Permission.AchievementDeleted,
            )
          ) {
            const notify: INotification = this.notifyService.buildNotification(
              'Достижение успешно удалено',
              `Вы успешно удалили достижение «${achievement.title}»`,
              'error',
              'star',
              '',
            );
            this.notifyService
              .sendNotification(notify, this.currentUser.id, true)
              .subscribe();
          }
        },
      });

    this.achievementService.deleteAchievement(achievement.id).subscribe();
  }

  throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }
  handleErrorModal() {
    this.errorModal = false;
  }

  actionAchievement: IAchievement | undefined;

  handleDeleteModal(answer: boolean) {
    if (answer && this.actionAchievement)
      this.deleteAchievement(this.actionAchievement);
    this.deleteModal = false;
  }

  deleteModal = false;

  handleSuccessDeleteModal() {
    this.successDeleteModal = false;
  }
  errorModalContent = '';

  errorModal = false;

  loadingModal = false;
  successDeleteModal = false;

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }
}
