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
  forkJoin,
  map,
  of,
} from 'rxjs';

import { INotification } from 'src/app/modules/user-pages/models/notifications';
import {
  IUser,
  nullUser,
} from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { AuthService } from '../../../services/auth.service';
import {
  getName,
  notifyForAuthorOfApprovedCategory,
  notifyForAuthorOfDismissedCategory,
} from '../notifications';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import {
  ICategory,
  ISection,
  nullCategory,
} from 'src/app/modules/recipes/models/categories';
import { SectionService } from 'src/app/modules/recipes/services/section.service';
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
  loaded = true;
  error = '';
  errorModal = false;
  actionCategory: ICategory = { ...nullCategory };
  actionModal = false;
  categories: ICategory[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private titleService: Title,
    private sectionService: SectionService,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private userService: UserService,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Рассмотрение категорий');
  }

  ngOnInit() {
    this.currentUserInitialize();
    this.checkActualCategories();
  }

  checkActualCategories() {
    this.currentStep = 0;
    this.loadMoreUpdates(true);
  }

  loadMoreUpdates(checkUpdates?: boolean) {
    if (this.loaded) {
      this.loaded = false;
      this.categoryService
        .getAwaitsCategories(this.categoriesPerStep, this.currentStep)
        .subscribe((response: any) => {
          setTimeout(() => {
            const newCategories: ICategory[] = response.results;
            const count = response.count;

            if (checkUpdates) {
              this.everythingLoaded = false;
              this.categories = [];
            }
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

              if (category.sectionId) {
                this.sectionService
                  .getSectionShortInfoForAwaitingCategory(category.sectionId)
                  .subscribe((response: any) => {
                    category.section = response[0] as ISection;
                    this.cd.markForCheck();
                  });
              }
              if (category.authorId) {
                this.userService
                  .getUserShortInfoForUpdate(category.authorId)
                  .pipe(
                    tap((updateAuthor: IUser) => {
                      category.author = updateAuthor;
                      this.cd.markForCheck();
                    }),
                  )
                  .subscribe();
              }
            });

            if (actualCategories.length > 0) {
              if (actualCategories.length < 3) {
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
          }, 1500);
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

  approveCategory() {
    setTimeout(() => {
      if (this.actionCategory) {
        this.categoryService
          .publishCategory(this.actionCategory.id)
          .pipe(
            tap(() => {
              this.categories = this.categories.filter(
                (u) => u.id !== this.actionCategory.id,
              );

               if (
                 this.userService.getPermission(
                   this.currentUser.limitations || [],
                   Permission.WorkNotifies,
                 )
               ) {
                 this.sendNotifyToManager(
                   true,
                   this.actionCategory,
                 ).subscribe();
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
    }, 1500);
  }

  dismissCategory() {
    setTimeout(() => {
      if (this.actionCategory) {
        const deleteCategory$ = this.categoryService.deleteCategory(
          this.actionCategory.id,
        );

        const deleteImage$ = this.actionCategory.image
          ? this.categoryService.deleteImage(this.actionCategory.image).pipe(
              catchError(() => {
                this.error =
                  'Произошла ошибка при удалении изображения удаляемой категории';

                this.errorModal = true;
                this.loadingModal = false;

                this.cd.markForCheck();

                return EMPTY;
              }),
            )
          : of(null);

        forkJoin([deleteImage$, deleteCategory$])
          .pipe(
            map(() => {
              this.categories = this.categories.filter(
                (u) => u.id !== this.actionCategory.id,
              );
              this.sendDismissNotify();
              this.actionModal = true;
            }),
          )
          .subscribe({
            next: () => {
              this.loadingModal = false;

              this.cd.markForCheck();
            },
            error: (error) => {
              console.log(error);
            },
          });
      }
    });
  }

  confirmModal = false;

  private sendApproveNotify(): void {
    if (this.actionCategory.author) {
      const author: IUser = this.actionCategory.author;
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
            this.notifyService.sendNotification(notify, author.id).subscribe();
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
  protected getName(user: IUser): string {
    return getName(user);
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

  sendNotifyToManager(approve: boolean, category:ICategory) {
    const panel =
      this.currentUser.role === 'admin' ? 'администратора' : 'модератора';
    const message = `Вы успешно ${
      approve ? 'приняли' : 'отклонили'
    } категорию «${
      category.name
    }» в панели ${panel}`;
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
    if (this.actionCategory.author) {
      const author: IUser = this.actionCategory.author;
      const notifyForAuthor = notifyForAuthorOfDismissedCategory(
        this.actionCategory,
        this.notifyService,
      );

          if (
            this.userService.getPermission(
              this.currentUser.limitations || [],
              Permission.WorkNotifies,
            )
          )
      
          {
            this.sendNotifyToManager(false,this.actionCategory).subscribe()
      }
      
      this.userService
              .getLimitation(
                this.actionCategory.authorId,
                Permission.CategoryReviewed,
              )
              .subscribe((limit) => {
                if (!limit && this.actionCategory) {
                  this.notifyService
                    .sendNotification(notifyForAuthor, author.id)
                    .subscribe();
                }
              });
    }
  }
}
