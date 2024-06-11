import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { modal } from 'src/tools/animations';
import { AuthService } from '../../../services/auth.service';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  finalize,
  forkJoin,
  takeUntil,
  tap,
} from 'rxjs';
import { Title } from '@angular/platform-browser';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { getFormattedDate } from 'src/tools/common';
import { notifyForDemotedUser } from '../notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';

@Component({
  templateUrl: './moderators.component.html',
  styleUrl: '../control-dashboard.component.scss',
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlModeratorsComponent implements OnInit, OnDestroy {
  currentUser: IUser = nullUser;
  private destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();

  loaded = false;
  moderators: IUser[] = [];
  everythingLoaded = false;

  // modals
  successModal = false;
  confirmModal = false;
  loadingModal = false;

  placeholder = '/assets/images/userpic.png';

  actionModerator: IUser = nullUser;

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private cd: ChangeDetectorRef,
    private userService: UserService,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Модераторы');
  }

  ngOnInit() {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1080) {
      this.moderatorsPerStep = 2;
      this.preloader = Array.from(
        { length: this.moderatorsPerStep },
        (v, k) => k,
      );
    }
    this.initCurrentUser();
    this.checkActualModerators();
  }
  moderatorsPerStep = 3;
  preloader = Array.from({ length: this.moderatorsPerStep }, (v, k) => k);

  currentStep = 0;

  loadMoreModerators() {
    if (this.loaded || !this.moderators.length) {
      this.loaded = false;

      this.subscriptions.add(
        this.authService
          .getSomeModerators(this.moderatorsPerStep, this.currentStep)
          .pipe(takeUntil(this.destroyed$))
          .subscribe((response: any) => {
            const newModerators: IUser[] = response.moderators;
            const count = response.count;

            const actualModerators = newModerators.filter(
              (newUpdate) =>
                !this.moderators.some(
                  (existingUpdate) => existingUpdate.id === newUpdate.id,
                ),
            );

            const subscribes$: Observable<any>[] = [];

            if (actualModerators.length) {
              actualModerators.forEach((actualModerator) => {
                if (actualModerator.image) {
                  subscribes$.push(
                    this.userService.downloadUserpic(actualModerator.image).pipe(
                      tap((blob) => {
                        actualModerator.avatarUrl = URL.createObjectURL(blob);
                        this.cd.markForCheck();
                      }),
                      catchError(() => {
                        actualModerator.avatarUrl = '';
                        return EMPTY;
                      }),
                    ),
                  );
                }
              });
              this.subscriptions.add(

                forkJoin(subscribes$).pipe(takeUntil(this.destroyed$)).subscribe(() => {
                  if (actualModerators.length > 0) {
                    if (actualModerators.length < this.moderatorsPerStep) {
                      this.everythingLoaded = true;
                    }
                    this.moderators = [...this.moderators, ...actualModerators];
                    this.currentStep++;
                  } else {
                    this.everythingLoaded = true;
                  }
                  if (count <= this.moderators.length) {
                    this.everythingLoaded = true;
                  }
                  this.loaded = true;
                  this.cd.markForCheck();
                }));
            } else {
              this.currentStep = 0;
              this.everythingLoaded = true;
              this.loaded = true;
              this.cd.markForCheck();
            }
          }));
    }
  }

  private initCurrentUser() {
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((user) => {
          this.currentUser = user;
        }));
  }

  checkActualModerators() {
    this.moderators = [];
    this.everythingLoaded = false;
    this.currentStep = 0;
    this.loadMoreModerators();
  }

  handleSuccessModal() {
    this.successModal = false;
  }
  handleConfirmModal(answer: boolean) {
    if (answer) {
      this.demoteModerator(this.actionModerator);
    }
    this.confirmModal = false;
  }

  demoteModerator(moderator: IUser) {
    this.loadingModal = true;
    this.userService
      .demoteModerator(moderator.id)
      .pipe(
        tap(() => {
          this.successModal = true;
          this.checkActualModerators();

          const notifyForAdmin: INotification =
            this.notifyService.buildNotification(
              'Вы разжаловали модератора',
              `Вы успешно разжаловали модератора сайта Yummy @${
                moderator.username
              }${moderator.fullName ? ` (${moderator.fullName})` : ''}`,
              'error',
              'manager',
              `/cooks/list/${moderator.id}`,
            );
          this.notifyService
            .sendNotification(
              notifyForDemotedUser(this.notifyService),
              moderator.id,
            )
            .subscribe();
          this.notifyService
            .sendNotification(notifyForAdmin, this.currentUser.id, true)
            .subscribe();
        }),
        finalize(() => {
          this.loadingModal = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe();
  }

  getDate(date: string) {
    return getFormattedDate(date);
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }
}
