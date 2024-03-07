import { trigger } from '@angular/animations';
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
  takeUntil,
  tap,
  finalize,
  catchError,
  EMPTY,
  of,
  forkJoin,
  map,
  Observable,
} from 'rxjs';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { modal } from 'src/tools/animations';
import { AuthService } from '../../../services/auth.service';
import { getName, notifyForAuthorOfIngredient } from '../notifications';
import { getUser } from '../quick-actions';
import { IngredientService } from 'src/app/modules/recipes/services/ingredient.service';
import { IIngredient } from 'src/app/modules/recipes/models/ingredients';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

IngredientService;
@Component({
  templateUrl: './control-ingredients.component.html',
  animations: [trigger('modal', modal())],
  styleUrl: '../control-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlIngredientsComponent implements OnInit, OnDestroy {
  title = 'Рассмотрение ингредиентов';

  currentUser: IUser = { ...nullUser };

  everythingLoaded = false;
  loaded = true;
  currentStep = 0;

  ingredients: IIngredient[] = [];
  users: IUser[] = [];

  actionIngredient: IIngredient | null = null;
  action: 'approve' | 'dismiss' = 'dismiss';

  loadingModal = false;
  actionModal = false;
  errorModal = false;
  confirmModal = false;
  error = '';

  placeholder = '/assets/images/ingredient-placeholder.png';

  ingredientsPerStep = 3;

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private titleService: Title,
    private cd: ChangeDetectorRef,
    private ingredientService: IngredientService,
    private authService: AuthService,
    private userService: UserService,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Рассмотрение ингредиентов');
  }

  ngOnInit() {
    this.currentUserInitialize();
    this.checkActualIngredients();
  }

  checkActualIngredients() {
    this.currentStep = 0;
    this.loadMoreIngredients(true);
  }

  loadMoreIngredients(check?: boolean) {
    if (this.loaded) {
      this.loaded = false;
      this.ingredientService
        .getSomeAwaitingIngredients(this.ingredientsPerStep, this.currentStep)
        .subscribe((response: any) => {
          const newIngredients: IIngredient[] = response.ingredients;
          const count = response.count;

          if (check) {
            this.ingredients = [];
            this.users = [];
            this.everythingLoaded = false;
          }
          const actualIngredients = newIngredients.filter(
            (newUpdate) =>
              !this.ingredients.some(
                (existingUpdate) => existingUpdate.id === newUpdate.id,
              ),
          );

          const subscribes$: Observable<any>[] = [];

          if (actualIngredients.length) {
            actualIngredients.forEach((ingredient) => {
              if (ingredient.author) {
                subscribes$.push(
                  this.userService
                    .getUserShortInfoForUpdate(ingredient.author)
                    .pipe(
                      tap((updatedAuthor: IUser) => {
                        this.users.push(updatedAuthor);
                        this.cd.markForCheck();
                      }),
                    ),
                );
              }
              if (ingredient.image) {
                subscribes$.push(
                  this.ingredientService.downloadImage(ingredient.image).pipe(
                    tap((blob) => {
                      ingredient.imageURL = URL.createObjectURL(blob);
                      this.cd.markForCheck();
                    }),
                    catchError(() => {
                      ingredient.imageURL = '';
                      return EMPTY;
                    }),
                  ),
                );
              }
            });

            forkJoin(subscribes$).subscribe(() => {
              if (actualIngredients.length > 0) {
                if (actualIngredients.length < 3) {
                  this.everythingLoaded = true;
                }
                this.ingredients = [...this.ingredients, ...actualIngredients];
                this.currentStep++;
              } else {
                this.everythingLoaded = true;
              }
              if (count <= this.ingredients.length) {
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

  handleConfirmModal(answer: boolean) {
    this.confirmModal = false;
    if (answer) {
      this.loadingModal = true;
      if (this.action === 'approve') {
        this.approveIngredient();
      } else {
        this.dismissIngredient();
      }
    }
    this.cd.markForCheck();
  }

  protected handleSuccessUpdateActionModal(): void {
    this.actionModal = false;
  }

  approveIngredient() {
    setTimeout(() => {
      if (this.actionIngredient) {
        this.ingredientService
          .approveIngredient(this.actionIngredient.id)
          .pipe(
            tap(() => {
              if (this.actionIngredient) {
                this.actionIngredient.status = 'public';

                if (this.actionIngredient.author) {
                  const authorId = this.actionIngredient.author;
                  const notify = notifyForAuthorOfIngredient(
                    this.actionIngredient,
                    'approve',
                    this.notifyService,
                  );


                  this.userService
                    .getLimitation(authorId, Permission.IngredientReviewed)
                    .subscribe((limit) => {
                      if (!limit) {
                        this.notifyService
                          .sendNotification(notify, authorId)
                          .subscribe();

                      }
                    })
                  // your-ingredient-published

                  if (this.userService.getPermission(this.currentUser.limitations || [], Permission.WorkNotifies)) {


                    this.sendNotifyToManager(
                      this.action === 'approve',
                      this.actionIngredient,
                    ).subscribe();
                  }
                }

                this.actionModal = true;
                this.cd.markForCheck();
              }
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

  dismissIngredient() {
    if (this.actionIngredient) {
      const deleteIngredient$ = this.ingredientService.deleteIngredient(
        this.actionIngredient.id,
      );

      const deleteImage$ = this.actionIngredient.image
        ? this.ingredientService.deleteImage(this.actionIngredient.image).pipe(
            catchError(() => {
              this.error =
                'Произошла ошибка при удалении изображения удаляемого ингредиента';
              this.errorModal = true;
              this.loadingModal = false;
              this.cd.markForCheck();
              return EMPTY;
            }),
          )
        : of(null);

      forkJoin([deleteImage$, deleteIngredient$])
        .pipe(
          map(() => {
            if (this.actionIngredient)
              this.ingredientService.deleteIngredientFromIngredients(
                this.actionIngredient,
              );
            this.ingredients = this.ingredients.filter(
              (u) => u.id !== this.actionIngredient?.id,
            );

            
            this.sendDismissNotify();

            if (this.userService.getPermission(this.currentUser.limitations || [], Permission.WorkNotifies) && this.actionIngredient) {


              this.sendNotifyToManager(
                false,
                this.actionIngredient,
              ).subscribe();
            }
            this.actionModal = true;
          }),
        )
        .subscribe({
          next: () => {
            this.loadingModal = false;
            this.cd.markForCheck();
          },
        });
    }
  }

  sendNotifyToManager(approve: boolean, ingredient: IIngredient) {
      const panel =
        this.currentUser.role === 'admin' ? 'администратора' : 'модератора';
      const authorName = this.getName(this.getUser(ingredient.author!));
      const message = `Вы успешно ${approve ? 'приняли' : 'отклонили'
        } ингредиент «${ingredient.name
        }» от пользователя ${authorName} в панели ${panel}`;
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
    if (this.actionIngredient?.author) {
      const authorId = this.actionIngredient.author;
      this.userService
        .getLimitation(authorId, Permission.IngredientReviewed)
        .subscribe((limit) => {
          if (!limit && this.actionIngredient) {

            const notify = notifyForAuthorOfIngredient(
              this.actionIngredient,
              'dismiss',
              this.notifyService,
            );
            //your-ingredient-published
            this.notifyService.sendNotification(notify, authorId).subscribe();
          }
        })
    }
  }

  protected updateToReviewActionClick(
    action: 'dismiss' | 'approve',
    ingredient: IIngredient,
  ): void {
    this.action = action;
    this.confirmModal = true;
    this.actionIngredient = ingredient;
  }

  getDate(date: string) {
    return new Date(date);
  }
  protected getName(user: IUser): string {
    return getName(user);
  }

  getUser(userId: number) {
    return getUser(userId, this.users);
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
}
