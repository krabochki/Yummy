import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import {
  notifyForAuthorOfApprovedRecipe,
  notifyForAuthorOfDismissedRecipe,
  notifyForFollowersOfApprovedRecipeAuthor,
} from '../notifications';
import {
  EMPTY,
  Subject,
  catchError,
  filter,
  finalize,
  forkJoin,
  takeUntil,
  tap,
} from 'rxjs';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { showContext } from '../updates/const';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

@Component({
  animations: [trigger('modal', modal())],
  templateUrl: './control-recipes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../control-dashboard.component.scss',
})
export class ControlRecipesComponent implements OnInit, OnDestroy {
  currentUser: IUser = { ...nullUser };
  everythingLoaded = false;
  loaded = false;
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
    this.recipes = [];
    this.currentUserInitialize();
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1080) {
      this.recipesPerStep = 2;
      this.preloader = Array.from({ length: this.recipesPerStep }, (v, k) => k);
    }

    this.checkActualRecipes();
  }

  checkActualRecipes() {
        this.recipes = [];
        this.everythingLoaded = false;

    this.currentStep = 0;

    this.loadMoreRecipes();
  }


  

  recipesPerStep = 3;
  preloader = Array.from({ length: this.recipesPerStep }, (v, k) => k);

  loadMoreRecipes() {
    if (this.loaded || !this.recipes.length) {
      this.loaded = false;
      this.recipeService
        .getSomeAwaitingRecipes(this.recipesPerStep, this.currentStep)
        .subscribe((response: any) => {
          const newRecipes: IRecipe[] = response.recipes;
          const count = response.count;
       
          const actualRecipes = newRecipes.filter(
            (newUpdate) =>
              !this.recipes.some(
                (existingUpdate) => existingUpdate.id === newUpdate.id,
              ),
          );

          if (actualRecipes.length > 0) {
            if (actualRecipes.length < this.recipesPerStep) {
              this.everythingLoaded = true;
            }

            this.loadRecipesImages(actualRecipes);
            this.recipes = [...actualRecipes, ...this.recipes];
            this.currentStep++;
          } else {
            this.everythingLoaded = true;
          }
          if (count <= this.recipes.length) {
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
                  this.actionRecipe.authorName || '',
                  this.actionRecipe,
                  this.notifyService,
                );

              const notifications = authorFollowers.map((follower) => {
                return this.userService
                  .getLimitation(follower, Permission.RecipeFromFollowing)
                  .pipe(
                    filter((limit) => !limit),
                    tap(() =>
                      this.notifyService.sendNotification(
                        notifyForFollower,
                        follower,
                      ),
                    ),
                  );
              });

              forkJoin(notifications).subscribe();
            }
          }),
        )
        .subscribe();
    }
  }

  private loadRecipesImages(recipes: IRecipe[]) {
    recipes.forEach((recipe) => {
      if (recipe.mainImage) {
        recipe.imageLoading = true;

        this.recipeService
          .downloadRecipeImage(recipe.mainImage)
          .pipe(
            tap((blob) => {
              recipe.imageURL = URL.createObjectURL(blob);
            }),
            finalize(() => {
              recipe.imageLoading = false;
              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }
    });
  }

  approveUpdate() {
    if (this.actionRecipe) {
      this.recipeService
        .approveRecipe(this.actionRecipe.id)
        .pipe(
          tap(() => {
            if (this.actionRecipe) {
              this.actionRecipe.status = 'public';

              if (this.actionRecipe.authorId) {
                const authorId = this.actionRecipe.authorId;

                this.userService
                  .getLimitation(authorId, Permission.RecipeReviewed)
                  .subscribe((limit) => {
                    if (!limit && this.actionRecipe) {
                      const notify = notifyForAuthorOfApprovedRecipe(
                        this.actionRecipe,
                        this.notifyService,
                      );
                      this.notifyService
                        .sendNotification(notify, authorId)
                        .subscribe();
                    }
                  });

                this.sendNotifiesAfterPublishingRecipe();
              }

              this.checkActualRecipes();

              this.actionModal = true;
            }
          }),
          catchError((e: any) => {
            this.errorText = e.error.message;
            this.errorModal = true;
              this.checkActualRecipes();

            return EMPTY;
          }),
          finalize(() => {
            this.loadingModal = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  errorModal = false;
  errorText = '';

  dismissUpdate() {
    if (this.actionRecipe) {
      this.recipeService
        .dismissRecipe(this.actionRecipe.id)
        .pipe(
          tap(() => {
            if (this.actionRecipe) {
              if (this.actionRecipe.authorId) {
                this.userService
                  .getLimitation(
                    this.actionRecipe.authorId,
                    Permission.RecipeReviewed,
                  )
                  .subscribe((limit) => {
                    if (!limit && this.actionRecipe) {
                      const authorId = this.actionRecipe.authorId;
                      const notify = notifyForAuthorOfDismissedRecipe(
                        this.actionRecipe,
                        this.notifyService,
                      );
                      this.notifyService
                        .sendNotification(notify, authorId)
                        .subscribe();
                    }
                  });
              }

              this.checkActualRecipes();
              this.actionModal = true;
            }
          }),
          catchError((e: any) => {
            this.errorText = e.error.message;
            this.errorModal = true;
              this.checkActualRecipes();
            return EMPTY;
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
