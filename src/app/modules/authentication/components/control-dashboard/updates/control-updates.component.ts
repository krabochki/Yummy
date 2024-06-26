import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { tap, finalize, Subject, takeUntil, Observable, forkJoin, catchError, EMPTY, switchMap, Subscription } from 'rxjs';
import { nullUpdate, IUpdate } from 'src/app/modules/common-pages/components/updates/updates/const';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import {
  notifyForAuthorOfApprovedUpdate,
  notifyForAuthorOfDismissedUpdate,
} from '../notifications';
import { UpdatesService } from 'src/app/modules/common-pages/services/updates.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import { showContext } from './const';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

@Component({
  animations: [trigger('modal', modal())],
  templateUrl: './control-updates.component.html',
  styleUrl: '../control-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlUpdatesComponent implements OnInit, OnDestroy {
  currentUser: IUser = { ...nullUser };
  action: 'dismiss' | 'approve' = 'dismiss';
  loadingModal = false;
  private currentStep = 0;
  everythingLoaded = false;
  private updatesPerStep = 3;
  preloader = Array.from({ length: this.updatesPerStep }, (v, k) => k);
  loaded = false;
  actionUpdate: IUpdate = nullUpdate;
  actionModal = false;
  updates: IUpdate[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();

  constructor(
    private titleService: Title,
    private updateService: UpdatesService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private userService: UserService,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Рассмотрение новостей');

    const screenWidth = window.innerWidth;

    if (screenWidth <= 1080) {
      this.updatesPerStep = 2;
      this.preloader = Array.from({ length: this.updatesPerStep }, (v, k) => k);
    }
  }

  ngOnInit() {
    this.currentUserInitialize();
    this.checkActualUpdates();
  }

  checkActualUpdates() {
        this.updates = [];
        this.everythingLoaded = false;

    this.currentStep = 0;
    this.loadMoreUpdates();
  }

  loadMoreUpdates() {
    if (this.loaded || !this.updates.length) {
      this.loaded = false;
      this.subscriptions.add(
        this.updateService
          .getAwaitsUpdates(this.updatesPerStep, this.currentStep)
          .pipe(takeUntil(this.destroyed$))
          .subscribe((response: any) => {
            const newUpdates: IUpdate[] = response.results;
            const count = response.count;
            if (!newUpdates.length) {
              this.everythingLoaded = true;
              this.loaded = true;
              this.cd.markForCheck();
              return;
            }
            const actualUpdates = newUpdates.filter(
              (newUpdate) =>
                !this.updates.some(
                  (existingUpdate) => existingUpdate.id === newUpdate.id,
                ),
            );

            if (actualUpdates.length > 0) {
              if (actualUpdates.length < this.updatesPerStep) {
                this.everythingLoaded = true;
              }
              this.updates = [...this.updates, ...actualUpdates];
              this.currentStep++;
            } else {
              this.everythingLoaded = true;
            }
            if (count <= this.updates.length) {
              this.everythingLoaded = true;
            }
            this.loaded = true;

            this.cd.markForCheck();
          }));
    }
  }

  handleConfirmModal(answer: boolean) {
    this.confirmModal = false;

    if (answer) {
      this.loadingModal = true;
      if (this.action === 'approve') {
        this.approveUpdate();
      } else {
        this.dismissUpdate();
      }
    }
    this.cd.markForCheck();
  }
  error: string = '';
  errorModal: boolean = false;

  approveUpdate() {
    if (this.actionUpdate) {
      this.updateService
        .publishUpdate(this.actionUpdate.id)

        .pipe(
          catchError((e: any) => {
            this.error = e.error.message;
            this.errorModal = true;
                    this.checkActualUpdates();

            return EMPTY;
          }),

          tap(() => {
            this.actionUpdate.status = 'public';

            if (this.actionUpdate.authorId) {
              this.userService
                .getLimitation(
                  this.actionUpdate.authorId,
                  Permission.NewsReviewed,
                )
                .subscribe((limit) => {
                  if (!limit) {
                    const notify = notifyForAuthorOfApprovedUpdate(
                      this.actionUpdate,
                      this.notifyService,
                    );
                    this.notifyService
                      .sendNotification(notify, this.actionUpdate.authorId)
                      .subscribe();
                  }
                });
            }

            this.sendNotificationAboutUpdate(this.actionUpdate);
                    this.checkActualUpdates();
            this.actionModal = true;
          }),
          finalize(() => {
            this.loadingModal = false;

            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  sendNotificationAboutUpdate(update: IUpdate) {
    if (update.notify !== 'nobody') {
      const updateNotification = this.notifyService.buildNotification(
        update.shortName,
        'А у нас новости! Вы можете ознакомиться с нововведениями, нажав на уведомление.',
        'success',
        'update',
        '/news',
      );

      let getUsers$: Observable<any> = this.userService.getAllShort();
      if (update.notify === 'managers') {
        getUsers$ = this.userService.getManagersShort();
      }
      getUsers$
        .pipe(
          tap((users: IUser[]) => {
            if (users.length) {
              const sendNotifications$: Observable<any>[] = [];
              users.map((u) => {
                const forMe = u.id === this.currentUser.id;
                const sendNotification$ = this.notifyService.sendNotification(
                  updateNotification,
                  u.id,
                  forMe ? true : false,
                );
                sendNotifications$.push(sendNotification$);
              });
              forkJoin(sendNotifications$).subscribe();
            }
          }),
        )
        .subscribe();
    }
  }

  dismissUpdate() {
    if (this.actionUpdate) {

      const getStatus$ = this.updateService.getStatus(
              this.actionUpdate.id,
      );
      

      
            
      const deleteUpdate$ = this.updateService
        .deleteUpdate(this.actionUpdate.id)
        .pipe(
          tap(() => {
            const authorId = this.actionUpdate.authorId;
            if (authorId) {
              this.userService
                .getLimitation(authorId, Permission.NewsReviewed)
                .subscribe((limit) => {
                  if (!limit) {
                    const notify = notifyForAuthorOfDismissedUpdate(
                      this.actionUpdate,
                      this.notifyService,
                    );
                    this.notifyService
                      .sendNotification(notify, authorId)
                      .subscribe();
                  }
                });
            }

                    this.checkActualUpdates();
            this.actionModal = true;
          }),
          finalize(() => {
            this.loadingModal = false;

            this.cd.markForCheck();
          }),
      );
      
            getStatus$
              .pipe(
                switchMap((status) => {
                  if (status === 'awaits') {
                    return deleteUpdate$
                  } else {
                    this.error =
                      'Новость была рассмотрена другим модератором';
                    this.errorModal = true;
                    this.checkActualUpdates();
                    this.cd.markForCheck();
                    return EMPTY;
                  }
                }),
                finalize(() => {
                  this.loadingModal = false;
                  this.cd.markForCheck();
                }),
              )
              .subscribe();

    }
  }

  confirmModal = false;

  protected updateToReviewActionClick(
    action: 'dismiss' | 'approve',
    update: IUpdate,
  ): void {
    this.action = action;
    this.confirmModal = true;
    this.actionUpdate = update;
  }

  showContext(context: string) {
    return showContext(context);
  }

  getDate(date: string) {
    return new Date(date);
  }

  currentUserInitialize() {
    this.subscriptions.add(
      this.authService.currentUser$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((receivedUser: IUser) => {
          this.currentUser = receivedUser;
        }));
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();

    this.subscriptions.unsubscribe();
  }
}
