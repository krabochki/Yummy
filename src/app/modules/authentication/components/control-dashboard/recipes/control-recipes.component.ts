import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import {
  getName,
  notifyForAuthorOfApprovedRecipe,
  notifyForAuthorOfDismissedRecipe,
  notifyForFollowersOfApprovedRecipeAuthor,
} from '../notifications';
import { Observable, Subject, finalize, forkJoin, takeUntil, tap } from 'rxjs';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import {
  IUser,
  nullUser,
} from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { showContext } from '../updates/const';
import { getUser } from '../quick-actions';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';

@Component({
  animations: [trigger('modal', modal())],
  templateUrl: './control-recipes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../control-dashboard.component.scss',
})
export class ControlRecipesComponent implements OnInit, OnDestroy {
  currentUser: IUser = { ...nullUser };
  everythingLoaded = false;
  loaded = true;
  placeholder = '/assets/images/recipe-placeholder.png';
  currentStep = 0;
  loadingModal = false;
  actionModal = false;
  recipes: IRecipe[] = [];
  actionRecipe: IRecipe | null = null;
  action: 'approve' | 'dismiss' = 'dismiss';

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private titleService: Title,
    private cd: ChangeDetectorRef,
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Рассмотрение рецептов');
  }

  ngOnInit() {
    this.recipeService.recipesSubject.next([]);
    this.userService.usersSubject.next([]);

    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes: IRecipe[]) => {
        this.recipes = receivedRecipes;
        this.cd.markForCheck();
      });
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers: IUser[]) => {
        this.users = receivedUsers;
      });
    this.currentUserInitialize();
    this.checkActualRecipes();
  }

  checkActualRecipes() {
    this.currentStep = 0;

    this.loadMoreRecipes(true);
  }

  recipesPerStep = 3;

  loadMoreRecipes(checkrecipes?: boolean) {
    if (this.loaded) {
      this.loaded = false;
      this.recipeService
        .getSomeAwaitingRecipes(this.recipesPerStep, this.currentStep)
        .subscribe((response: any) => {
          setTimeout(() => {
            const newRecipes: IRecipe[] = response.recipes;
            const count = response.count;
            if (checkrecipes) {
              this.recipeService.recipesSubject.next([]);
              this.userService.usersSubject.next([]);
              this.everythingLoaded = false;
              this.recipes = [];
            }
            const actualRecipes = newRecipes.filter(
              (newUpdate) =>
                !this.recipes.some(
                  (existingUpdate) => existingUpdate.id === newUpdate.id,
                ),
            );
            actualRecipes.forEach((recipe) => {
              if (recipe.authorId) {
                this.userService
                  .getUserShortInfoForUpdate(recipe.authorId)
                  .pipe(
                    tap((updateAuthor: IUser) => {
                      this.userService.addUserToUsers(updateAuthor);
                      this.cd.markForCheck();
                    }),
                  )
                  .subscribe();
              }
            });
            if (actualRecipes.length > 0) {
              if (actualRecipes.length < 3) {
                this.everythingLoaded = true;
              }

              actualRecipes.forEach((recipe) => {
                this.recipeService.addNewRecipe(
                  this.recipeService.translateRecipe(recipe),
                );
                this.recipeService.getRecipeImage(
                  this.recipeService.translateRecipe(recipe),
                );
              });
              this.currentStep++;
            } else {
              this.everythingLoaded = true;
            }
            if (count <= this.recipes.length) {
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
        this.approveUpdate();
      } else {
        this.dismissUpdate();
      }
    }
    this.cd.markForCheck();
  }

  protected handleSuccessUpdateActionModal(): void {
    this.actionModal = false;
    if (this.sendNotify && this.notify) {
      this.currentUser.notifications.push(this.notify);
      this.authService.setCurrentUser(this.currentUser);
      this.notify = null;
      this.sendNotify = false;
    }
  }

  sendNotify = false;
  notify: INotification | null = null;

  sendNotifiesAfterPublishingRecipe() {
    if (this.actionRecipe) {
      this.userService
        .getFollowersIds(this.actionRecipe.authorId)
        .pipe(
          tap((response: number[]) => {
            const authorFollowers = response;
            if (this.actionRecipe) {
              const notifyForFollower =
                notifyForFollowersOfApprovedRecipeAuthor(
                  this.getUser(this.actionRecipe.authorId),
                  this.actionRecipe,
                  this.notifyService,
                );
              const subscribes: Observable<any>[] = [];
              authorFollowers.forEach((follower) => {
                subscribes.push(
                  this.notifyService.sendNotification(
                    notifyForFollower,
                    follower,
                  ),
                );
              });

              const currentUserIsFollower = authorFollowers.includes(
                this.currentUser.id,
              );

              forkJoin(subscribes).subscribe(() => {
                if (currentUserIsFollower) {
                  this.currentUser.notifications.push(notifyForFollower);
                  this.authService.setCurrentUser(this.currentUser);
                }
              });
            }
          }),
        )
        .subscribe();
    }
  }

  approveUpdate() {
    setTimeout(() => {
      if (this.actionRecipe) {
        this.recipeService
          .approveRecipe(this.actionRecipe.id)
          .pipe(
            tap(() => {
              if (this.actionRecipe) {
                this.actionRecipe.status = 'public';

                if (this.actionRecipe.authorId) {
                  const authorId = this.actionRecipe.authorId;
                  const notify = notifyForAuthorOfApprovedRecipe(
                    this.actionRecipe,
                    this.notifyService,
                  );
                  this.notifyService.sendNotification(
                    notify,
                   authorId
                    //'manager-review-your-recipe',
                  ).subscribe();

                  this.sendNotifiesAfterPublishingRecipe();
                }

                this.recipeService.deleteRecipeFromRecipes(
                  this.actionRecipe.id,
                );

                this.actionModal = true;
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

  dismissUpdate() {
    setTimeout(() => {
      if (this.actionRecipe) {
        this.recipeService
          .dismissRecipe(this.actionRecipe.id)
          .pipe(
            tap(() => {
              if (this.actionRecipe) {
                if (this.actionRecipe.authorId) {
                  const authorId = this.actionRecipe.authorId;
                  const notify = notifyForAuthorOfDismissedRecipe(
                    this.actionRecipe,
                    this.notifyService,
                  );
                  this.notifyService.sendNotification(
                    notify,
                     authorId,
                  //  'manager-review-your-recipe',
                  ).subscribe();
                }

                this.recipeService.deleteRecipeFromRecipes(
                  this.actionRecipe.id,
                );

                this.actionModal = true;
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

  confirmModal = false;

  protected updateToReviewActionClick(
    action: 'dismiss' | 'approve',
    recipe: IRecipe,
  ): void {
    this.action = action;
    this.confirmModal = true;
    this.actionRecipe = recipe;
  }

  showContext(context: string) {
    return showContext(context);
  }

  getDate(date: string) {
    return new Date(date);
  }
  protected getName(user: IUser): string {
    return getName(user);
  }

  users: IUser[] = [];
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
