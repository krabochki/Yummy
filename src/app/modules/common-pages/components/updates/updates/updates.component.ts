import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  IUser,
  nullUser,
  role,
} from 'src/app/modules/user-pages/models/users';
import { UpdatesService } from '../../../services/updates.service';
import { IUpdate, nullUpdate } from './const';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Subject, Subscription, finalize, takeUntil, tap } from 'rxjs';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { getFormattedDate } from 'src/tools/common';
import { ActivatedRoute } from '@angular/router';
import { updateStatuses } from '../add-update/const';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-updates',
  templateUrl: './updates.component.html',
  styleUrls: ['../../../styles/common.scss', './updates.component.scss'],

  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
})
export class UpdatesComponent implements OnInit, OnDestroy {
  updates: IUpdate[] = [];
  filtered?: 'state' | 'tag' = undefined;
  filterContext = '';
  confirmModal = false;
  currentUser: IUser = nullUser;
  addUpdateMode = false;
  isLoaded = true;
  private currentPage = 0;
  allUpdatesLoaded = false;
  private updatesPerPage = 3;
  successModal = false;
  awaitModal = false;
  targetUpdateId: number = 0;
  deleteModal = false;
  private destroyed$: Subject<void> = new Subject<void>();
  subscriptions: Subscription = new Subscription();

  constructor(
    titleService: Title,
    private userService: UserService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private updateService: UpdatesService,
    private notifyService: NotificationService,
  ) {
    titleService.setTitle('Свежие новости и изменения');
  }
  updateStatuses = updateStatuses;

  ngOnInit() {
    this.isLoaded = false;
    this.route.data.subscribe(() => {
      this.startUpdatesLoad();
      this.subscriptions.add(
        this.authService.currentUser$.pipe(takeUntil(this.destroyed$)).subscribe((user: IUser) => {
          this.currentUser = user;
          this.cd.markForCheck();
        }));
    });
  }

  startUpdatesLoad() {
    this.currentPage = 0;
    this.updates = [];
    this.allUpdatesLoaded = false;
    this.isLoaded = true;

    this.loadMoreUpdates();
  }

  loadMoreUpdates() {
    if (this.isLoaded) {
      this.isLoaded = false;
      this.subscriptions.add(
      this.updateService
        .getPublicUpdates(
          this.updatesPerPage,
          this.currentPage,
          this.filtered,
          this.filterContext,
        )
          .pipe(
          takeUntil(this.destroyed$),
          tap((response: any) => {
            const newUpdates: IUpdate[] = response.results;
            const count = response.count;

            const actualUpdates = newUpdates.filter(
              (newUpdate) =>
                !this.updates.some(
                  (existingUpdate) => existingUpdate.id === newUpdate.id,
                ),
            );
            if (actualUpdates.length > 0) {
              this.updates = [...this.updates, ...actualUpdates];
              this.currentPage++;
            } else {
              this.allUpdatesLoaded = true;
            }
            if (count <= this.updates.length) {
              this.allUpdatesLoaded = true;
            }
            this.isLoaded = true;

            

            this.cd.markForCheck();
          }),
        )
        .subscribe())
    }
  }

  addParagraphs(text: string) {
    return text.replace(/\n/g, '<br>');
  }

  loadingModal = false;
  filteredStates(state: string) {
    return updateStatuses.filter((s) => s !== state);
  }

  successEditModal = false;

  changeState(update: IUpdate) {
    if (update.newState) {
      this.loadingModal = true;
      this.updateService
        .changeUpdateState(update.id, update.newState)
        .pipe(
          tap(() => {
            if (update.newState) update.state = update.newState;
            update.newState = '';
            update.open = false;

            if (
              this.userService.getPermission(
                this.currentUser.limitations || [],
                Permission.NewsEdited,
              )
            ) {
              const notify = this.notifyService.buildNotification(
                'Статус новости изменен',
                'Вы успешно изменили статус новости',
                'success',
                'update',
                '',
              );
              this.notifyService
                .sendNotification(notify, this.currentUser.id, true)
                .subscribe();
            }
            this.successEditModal = true;
          }),
          finalize(() => {
            this.loadingModal = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  filterByTag(tag: string) {
    this.filtered = 'tag';
    this.filterContext = tag;
    this.scrollToTop();
    this.startUpdatesLoad();
  }
  filterByState(state: string) {
    this.filtered = 'state';
    this.filterContext = state;
    this.scrollToTop();
    this.startUpdatesLoad();
  }

  clearFilter() {
    this.filtered = undefined;
    this.filterContext = '';
    this.scrollToTop();
    this.startUpdatesLoad();
  }

  actionUpdate? = nullUpdate;

  handleConfirmModal(response: boolean) {
    if (response && this.actionUpdate) {
      this.changeState(this.actionUpdate);
    } else {
      this.actionUpdate = undefined;
    }
    this.confirmModal = false;
  }

  showUpdateButtons() {
    return this.userService.getPermission(
      this.currentUser.limitations || [],
      Permission.NewsManagingButtons,
    );
  }

  handleDeleteModal(answer: boolean) {
    this.deleteModal = false;

    if (answer) {
      this.deleteUpdate(this.targetUpdateId);
    }
  }

  get descriptionAboutFilter() {
    if (this.isLoaded) {
      const context = this.filtered === 'state' ? 'состоянию' : 'тегу';
      const content = this.filterContext;
      return `Новости отфильтрованы по ${context} «${content}»`;
    } else {
      return `Загружаем отфильтрованные новости...`;
    }
  }

  scrollToTop() {
    const startTag = document.getElementById('start');
    if (startTag) {
      const headerHeight =
        document.getElementsByClassName('header')[0].clientHeight;
      window.scrollTo({
        top: startTag.offsetTop - headerHeight,
        behavior: 'smooth',
      });
    } else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteUpdate(id: number) {
    this.awaitModal = true;
    this.updateService
      .deleteUpdate(id)
      .pipe(
        tap(() => {
          if (
            this.userService.getPermission(
              this.currentUser.limitations || [],
              Permission.NewsDeleted,
            )
          ) {
            const notify = this.notifyService.buildNotification(
              'Новость удалена',
              'Вы успешно удалили новость',
              'error',
              'update',
              '',
            );
            this.notifyService
              .sendNotification(notify, this.currentUser.id, true)
              .subscribe();
          }
          this.successModal = true;
        }),
        finalize(() => {
          this.awaitModal = false;
          this.cd.markForCheck();
          this.targetUpdateId = 0;
        }),
      )
      .subscribe();
  }

  updateAuthorRole(role: role): string {
    if (role === 'admin') return 'администратор';
    else return 'модератор';
  }

  getFormattedDate(date: string) {
    return getFormattedDate(date);
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }
}
