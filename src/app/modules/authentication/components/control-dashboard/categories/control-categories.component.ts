import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  Subject,
  tap,
  finalize,
  takeUntil,
  catchError,
  EMPTY,

  Observable,
  switchMap,
} from 'rxjs';

import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { AuthService } from '../../../services/auth.service';
import {
  notifyForAuthorOfApprovedCategory,
  notifyForAuthorOfDismissedCategory,
} from '../notifications';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import {
  ICategory,
  nullCategory,
} from 'src/app/modules/recipes/models/categories';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
@Component({
  animations: [trigger('modal', modal())],
  templateUrl: './control-categories.component.html',
  styleUrl: '../control-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlCategoriesComponent implements OnInit, OnDestroy {
  categoryPlaceholder = '/assets/images/category-placeholder.png';

  currentUser: IUser = { ...nullUser };
  action: 'dismiss' | 'approve' = 'dismiss';
  loadingModal = false;
  private currentStep = 0;
  everythingLoaded = false;
  private categoriesPerStep = 3;
  preloader = Array.from({ length: this.categoriesPerStep }, (v, k) => k);

  loaded = false;
  errorModal = false;
  actionCategory: ICategory = { ...nullCategory };
  actionModal = false;
  categories: ICategory[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private titleService: Title,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private userService: UserService,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Рассмотрение категорий');
  }

  ngOnInit() {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1080) {
      this.categoriesPerStep = 2;
      this.preloader = Array.from(
        { length: this.categoriesPerStep },
        (v, k) => k,
      );
    }

    this.currentUserInitialize();
    this.checkActualCategories();
  }

  checkActualCategories() {
    this.categories = [];
    this.everythingLoaded = false;

    this.currentStep = 0;
    this.loadMoreUpdates();
  }

  loadMoreUpdates() {
    if (this.loaded || !this.categories.length) {
      this.loaded = false;
      this.categoryService
        .getAwaitsCategories(this.categoriesPerStep, this.currentStep)
        .subscribe((response: any) => {
          const newCategories: ICategory[] = response.results;
          const count = response.count;

          const actualCategories = newCategories.filter(
            (newUpdate) =>
              !this.categories.some(
                (existingUpdate) => existingUpdate.id === newUpdate.id,
              ),
          );

          actualCategories.forEach((category) => {
            if (category.image) {
              this.categoryService.downloadImage(category.image).subscribe({
                next: (blob) => {
                  category.imageURL = URL.createObjectURL(blob);
                  this.cd.markForCheck();
                },
                error: () => {
                  category.imageURL = '';
                },
              });
            }
          });

          if (actualCategories.length > 0) {
            if (actualCategories.length < this.categoriesPerStep) {
              this.everythingLoaded = true;
            }
            this.categories = [...this.categories, ...actualCategories];
            this.currentStep++;
          } else {
            this.everythingLoaded = true;
          }
          if (count <= this.categories.length) {
            this.everythingLoaded = true;
          }
          this.loaded = true;

          this.cd.markForCheck();
        });
    }
  }

  handleConfirmModal(answer: boolean) {
    this.confirmModal = false;

    if (answer) {
      this.loadingModal = true;
      if (this.action === 'approve') {
        this.approveCategory();
      } else {
        this.dismissCategory();
      }
    }
    this.cd.markForCheck();
  }

  protected handleSuccessUpdateActionModal(): void {
    this.actionModal = false;
  }
  errorText = '';

  approveCategory() {
    if (this.actionCategory) {
      this.categoryService
        .publishCategory(this.actionCategory.id)
        .pipe(
          catchError((e: any) => {
            this.errorText = e.error.message;
            this.errorModal = true;
            this.checkActualCategories();

            return EMPTY;
          }),

          tap(() => {
            this.checkActualCategories();

            if (
              this.userService.getPermission(
                this.currentUser.limitations || [],
                Permission.WorkNotifies,
              )
            ) {
              this.sendNotifyToManager(true, this.actionCategory).subscribe();
            }

            this.sendApproveNotify();
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

  dismissCategory() {
    if (this.actionCategory) {
      this.loadingModal = true;

      const getStatus$ = this.categoryService.getStatus(this.actionCategory.id);

      const deleteCategory$ = this.categoryService
        .deleteCategory(this.actionCategory.id)
        .pipe(
          tap(() => {
            this.checkActualCategories();
                        this.sendDismissNotify();
            this.actionModal = true;
            this.cd.markForCheck()

          }),
          catchError(() => {
            (this.errorText = 'Произошла ошибка при попытке удалить категорию'),
              (this.errorModal = true);
            return EMPTY;
          }),
        );

      const deleteImage$: Observable<any> = this.categoryService
        .deleteImage(this.actionCategory.id)
        .pipe(
          catchError(() => {
            this.errorText =
              'Произошла ошибка при попытке удалить файл изображения категории';
            this.errorModal = true;
            return EMPTY;
          }),
        );

      getStatus$
        .pipe(
          switchMap(status => {
            if (status === 'awaits') {
              // Если статус равен "awaits", выполняем удаление изображения и категории
              return deleteImage$.pipe(
                switchMap(() => deleteCategory$) // Удаляем категорию после удаления изображения
              );
            } else {
              this.errorText = 'Категория была рассмотрена другим модератором';
              this.errorModal = true;
            this.checkActualCategories();
              this.cd.markForCheck();
              return EMPTY;
            }
          }),
          finalize(() => {
            this.loadingModal = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe({
          next: () => {
            // Успешное удаление изображения и категории
          },
        
        })
    }
  }

  confirmModal = false;

  private sendApproveNotify(): void {
    if (this.actionCategory.authorId) {
      const notify = notifyForAuthorOfApprovedCategory(
        this.actionCategory,
        this.notifyService,
      );

      this.userService
        .getLimitation(
          this.actionCategory.authorId,
          Permission.CategoryReviewed,
        )
        .subscribe((limit) => {
          if (!limit && this.actionCategory) {
            this.notifyService
              .sendNotification(notify, this.actionCategory.authorId)
              .subscribe();
          }
        });
    }
  }

  protected updateToReviewActionClick(
    action: 'dismiss' | 'approve',
    category: ICategory,
  ): void {
    this.action = action;
    this.confirmModal = true;
    this.actionCategory = category;
  }

  getDate(date: string) {
    return new Date(date);
  }

  currentUserInitialize() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        this.currentUser = receivedUser;
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  sendNotifyToManager(approve: boolean, category: ICategory) {
    const panel =
      this.currentUser.role === 'admin' ? 'администратора' : 'модератора';
    const message = `Вы успешно ${
      approve ? 'приняли' : 'отклонили'
    } категорию «${category.name}» в панели ${panel}`;
    const notify = this.notifyService.buildNotification(
      `Панель ${panel}`,
      message,
      approve ? 'success' : 'error',
      'manager',
      '',
    );
    return this.notifyService.sendNotification(
      notify,
      this.currentUser.id,
      true,
    );
  }

  private sendDismissNotify(): void {
    if (this.actionCategory.authorId) {
      const notifyForAuthor = notifyForAuthorOfDismissedCategory(
        this.actionCategory,
        this.notifyService,
      );

      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.WorkNotifies,
        )
      ) {
        this.sendNotifyToManager(false, this.actionCategory).subscribe();
      }

      this.userService
        .getLimitation(
          this.actionCategory.authorId,
          Permission.CategoryReviewed,
        )
        .subscribe((limit) => {
          if (!limit && this.actionCategory) {
            this.notifyService
              .sendNotification(notifyForAuthor, this.actionCategory.authorId)
              .subscribe();
          }
        });
    }
  }
}
