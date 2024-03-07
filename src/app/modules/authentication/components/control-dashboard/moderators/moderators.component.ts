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
  loaded = true;
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
    this.initCurrentUser();
    this.checkActualModerators();
  }
  moderatorsPerStep = 3;
  currentStep = 0;

  loadMoreModerators(check?: boolean) {
    if (this.loaded) {
      this.loaded = false;

      this.authService
        .getSomeModerators(this.moderatorsPerStep, this.currentStep)
        .subscribe((response: any) => {
          const newModerators: IUser[] = response.moderators;
          const count = response.count;

          console.log(newModerators);

          if (check) {
            this.moderators = [];
            this.everythingLoaded = false;
          }
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

            forkJoin(subscribes$).subscribe(() => {
              if (actualModerators.length > 0) {
                if (actualModerators.length < 3) {
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
            });
          } else {
            this.currentStep = 0;
            this.everythingLoaded = true;
            this.loaded = true;
            this.cd.markForCheck();
          }
        });
    }
  }

  private initCurrentUser() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user) => {
        this.currentUser = user;
      });
  }

  checkActualModerators() {
    this.currentStep = 0;
    this.loadMoreModerators(true);
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
      .updateUserProperty(moderator.id, 'role', 'user')
      .pipe(
        tap(() => {
          this.successModal = true;
          this.moderators = this.moderators.filter(
            (m) => m.id !== moderator.id,
          );

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
  }
}
