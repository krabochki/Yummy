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
  Observable,
  switchMap,
  Subscription,
} from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { modal } from 'src/tools/animations';
import { AuthService } from '../../../services/auth.service';
import {  notifyForAuthorOfIngredient } from '../notifications';
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
  loaded = false;
  currentStep = 0;

  ingredients: IIngredient[] = [];

  actionIngredient: IIngredient | null = null;
  action: 'approve' | 'dismiss' = 'dismiss';

  loadingModal = false;
  actionModal = false;
  errorModal = false;
  confirmModal = false;
  error = '';

  placeholder = '/assets/images/ingredient-placeholder.png';

  ingredientsPerStep = 3;
  preloader = Array.from({ length: this.ingredientsPerStep }, (v, k) => k);
  protected destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();

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
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1080) {
      this.ingredientsPerStep = 2;
      this.preloader = Array.from(
        { length: this.ingredientsPerStep },
        (v, k) => k,
      );
    }

    this.checkActualIngredients();
  }

  checkActualIngredients() {
    this.ingredients = [];
    this.everythingLoaded = false;
    this.currentStep = 0;
    this.loadMoreIngredients();
  }

  loadMoreIngredients() {
    if (this.loaded || !this.ingredients.length) {
      this.loaded = false;
      this.subscriptions.add(
        this.ingredientService
          .getSomeAwaitingIngredients(this.ingredientsPerStep, this.currentStep)
          .pipe(takeUntil(this.destroyed$))
          .subscribe((response: any) => {
            const newIngredients: IIngredient[] = response.ingredients;
            const count = response.count;

            const actualIngredients = newIngredients.filter(
              (newUpdate) =>
                !this.ingredients.some(
                  (existingUpdate) => existingUpdate.id === newUpdate.id,
                ),
            );

            if (actualIngredients.length) {
              actualIngredients.forEach((ingredient) => {
                if (ingredient.image)
                  this.subscriptions.add(
                    this.ingredientService
                      .downloadImage(ingredient.image)
                      .pipe(
                        takeUntil(this.destroyed$),
                        tap((blob) => {
                          ingredient.imageURL = URL.createObjectURL(blob);
                          this.cd.markForCheck();
                        }),
                        catchError(() => {
                          ingredient.imageURL = '';
                          return EMPTY;
                        }),
                      )
                      .subscribe());
              });

              if (actualIngredients.length > 0) {
                if (actualIngredients.length < this.ingredientsPerStep) {
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
            } else {
              this.currentStep = 0;
              this.everythingLoaded = true;
              this.loaded = true;
              this.cd.markForCheck();
            }
          }));
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
    if (this.actionIngredient) {
      this.ingredientService
        .approveIngredient(this.actionIngredient.id)
        .pipe(
          catchError((e: any) => {
            this.error = e.error.message;
            this.errorModal = true;
            this.checkActualIngredients();

            return EMPTY;
          }),
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
                  });
                // your-ingredient-published

                if (
                  this.userService.getPermission(
                    this.currentUser.limitations || [],
                    Permission.WorkNotifies,
                  )
                ) {
                  this.sendNotifyToManager(
                    this.action === 'approve',
                    this.actionIngredient,
                  ).subscribe();
                }
              }

              this.checkActualIngredients();
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
  }

  dismissIngredient() {
    if (this.actionIngredient) {
      this.loadingModal = true;

      const getStatus$ = this.ingredientService.getStatus(
        this.actionIngredient.id,
      );

      const deleteIngredient$ = this.ingredientService
        .deleteIngredient(this.actionIngredient.id)
        .pipe(
          tap(() => {
            this.checkActualIngredients();
            this.sendDismissNotify();
            if (
              this.userService.getPermission(
                this.currentUser.limitations || [],
                Permission.WorkNotifies,
              ) &&
              this.actionIngredient
            ) {
              this.sendNotifyToManager(
                false,
                this.actionIngredient,
              ).subscribe();
            }
            this.actionModal = true;
          }),
          catchError(() => {
            this.error = 'Произошла ошибка при попытке удалить ингредиент';
            this.errorModal = true;
            return EMPTY;
          }),
        );

      const deleteImage$: Observable<any> = this.ingredientService
        .deleteImage(this.actionIngredient.id)
        .pipe(
          catchError(() => {
            this.error =
              'Произошла ошибка при попытке удалить файл изображения ингредиента';
            this.errorModal = true;
            return EMPTY;
          }),
        );

      getStatus$
        .pipe(
          switchMap((status) => {
            if (status === 'awaits') {
              // Если статус равен "awaits", выполняем удаление изображения и категории
              return deleteImage$.pipe(
                switchMap(() => deleteIngredient$), // Удаляем категорию после удаления изображения
              );
            } else {
              this.error = 'Ингредиент был рассмотрен другим модератором';
              this.errorModal = true;
              this.checkActualIngredients();
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

  sendNotifyToManager(approve: boolean, ingredient: IIngredient) {
    const panel =
      this.currentUser.role === 'admin' ? 'администратора' : 'модератора';
    const authorName = ingredient.authorName;
    const message = `Вы успешно ${
      approve ? 'приняли' : 'отклонили'
    } ингредиент «${
      ingredient.name
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
        });
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
    this.subscriptions.unsubscribe();
  }
}
