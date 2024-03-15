import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { Observable, Subject, forkJoin, takeUntil, tap } from 'rxjs';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

@Component({
  selector: 'app-recipe-list-item',
  templateUrl: './recipe-list-item.component.html',
  styleUrls: ['./recipe-list-item.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListItemComponent implements OnInit, OnDestroy {
  @Input() recipe: IRecipe = nullRecipe;
  @Input() showAuthor: boolean = true;
  @Input() shortView: boolean = false;

  protected destroyed$: Subject<void> = new Subject<void>();

  protected dataLoaded = false;
  protected currentUser: IUser = { ...nullUser };
  protected author: IUser = { ...nullUser };

  private vote: boolean = false;

  protected isAwaitingApprove: boolean = false;

  protected noAccessModalShow: boolean = false;
  protected moreAuthorButtons: boolean = false;
  protected voteModalShow: boolean = false;
  protected successVoteModalShow: boolean = false;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private notifyService: NotificationService,
    private eRef: ElementRef,
  ) {}

  ngOnInit() {
    this.currentUserInit();
    this.usersInit();
  }

  private currentUserInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedCurrentUser) => {
        this.currentUser = receivedCurrentUser;

        this.recipesInit();
      });
  }
  private recipesInit(): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes) => {
        const findedRecipe = receivedRecipes.find((recipe) => {
          return recipe.id === this.recipe.id;
        });

        if (findedRecipe) {
          this.recipe = findedRecipe;

          this.cd.markForCheck();
        }
      });
  }
  private usersInit(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((users) => {
        const findedAuthor = users.find((user) => {
          if (user.id === this.recipe.authorId) return true;
          else return false;
        });
        if (findedAuthor) this.author = findedAuthor;
        this.dataLoaded = true;
        this.cd.markForCheck();
      });
  }

  //добавляем рецепт в избранное
  makeThisRecipeFavorite() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.recipe.faved = !this.recipe.faved;
    if (this.recipe.faved) {
      this.recipeService
        .pushToFavorites(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.addRecipeToFavorites(
              this.recipe,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .removeFromFavorites(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.removeRecipeFromFavorites(
              this.recipe,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    }

    const authorId = this.recipe.authorId;
    if (
      this.recipe.faved &&
      authorId > 0 &&
      authorId !== this.currentUser.id
    ) {
      this.userService
        .getLimitation(authorId, Permission.YourRecipeFaved)
        .subscribe((limit) => {
          if (!limit) {const title =
            'Твой рецепт «' + this.recipe.name + '» кто-то добавил в избранное';

          const notify: INotification = this.notifyService.buildNotification(
            'Твой рецепт добавили в избранное',
            title,
            'info',
            'recipe',
            '/recipes/list/' + this.recipe.id,
          );
          this.notifyService.sendNotification(notify, authorId).subscribe();
          }
        });
      
    }
  }

  //лайкаем рецепт
  likeThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.recipe.liked = !this.recipe.liked;

    if (this.recipe.liked) {
      this.recipeService
        .setLike(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.likeRecipe(
              this.recipe,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .unsetLike(this.recipe.id, this.currentUser.id)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.unlikeRecipe(
              this.recipe,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    }
    const authorId = this.recipe.authorId;

    if (this.recipe.liked && authorId > 0 && authorId !== this.currentUser.id) {
      this.userService
        .getLimitation(authorId, Permission.YourRecipeLiked)
        .subscribe((limit) => {
          if (!limit) {
            const notify: INotification = this.notifyService.buildNotification(
              'Твой рецепт оценили',
              `Твой рецепт «${this.recipe.name}» понравился кулинару ${
                this.currentUser.fullName
                  ? this.currentUser.fullName
                  : '@' + this.currentUser.username
              }`,
              'info',
              'recipe',
              '/cooks/list/' + this.currentUser.id,
            );
            this.notifyService.sendNotification(notify, authorId).subscribe();
          }
        });
    }
  }

  cookThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.recipe.cooked = !this.recipe.cooked;

    if (this.recipe.cooked) {
      const subscribes: Observable<any>[] = [];
      subscribes.push(
        this.recipeService.setCook(this.recipe.id, this.currentUser.id),
      );
      subscribes.push(
        this.recipeService.pushVoteForRecipe(
          this.recipe.id,
          this.currentUser.id,
          this.vote,
        ),
      );
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            let recipe = this.recipeService.cookRecipe(this.recipe);
            recipe = this.recipeService.voteForRecipe(
              this.recipe,
              this.currentUser.id,
              this.vote,
            );
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    } else {
      const subscribes: Observable<any>[] = [];
      subscribes.push(
        this.recipeService.removeVoteForRecipe(
          this.recipe.id,
          this.currentUser.id,
        ),
      );
      subscribes.push(
        this.recipeService.unsetCook(this.recipe.id, this.currentUser.id),
      );
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            const recipe = this.recipeService.uncookRecipe(this.recipe);
            this.recipeService.updateRecipeInRecipes(recipe);
          }),
        )
        .subscribe();
    }

    if (this.recipe.cooked) this.successVoteModalShow = true;
  }

  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  handleVoteModal(event: boolean) {
    this.recipe = this.recipeService.voteForRecipe(
      this.recipe,
      this.currentUser.id,
      !!event,
    );
    this.vote = event;
    this.cookThisRecipe();
    this.voteModalShow = false;
  }
   
  handleSuccessVoteModal() {
    this.successVoteModalShow = false;

    const authorId = this.recipe.authorId;
    setTimeout(() => {
      if (
        this.recipe.cooked &&
        authorId > 0 &&
        authorId !== this.currentUser.id
      ) {
        this.userService
          .getLimitation(authorId, Permission.YourRecipeFaved)
          .subscribe((limit) => {
            if (!limit) {
              const notify: INotification =
                this.notifyService.buildNotification(
                  'Твой рецепт приготовили',
                  `Твой рецепт «${this.recipe.name}» приготовил кулинар ${
                    this.currentUser.fullName
                      ? this.currentUser.fullName
                      : '@' + this.currentUser.username
                  }${
                    this.vote
                      ? ' и оставил положительный отзыв'
                      : ' и оставил негативный отзыв'
                  }`,
                  'info',
                  'recipe',
                  '/cooks/list/' + this.currentUser.id,
                );
              this.notifyService.sendNotification(notify, authorId);
            }
          });
      }

      this.vote = false;
    });
  }

  innerClick($event: any) {
    $event.stopPropagation();
    $event.preventDefault();
  }
  loading = false;

  @HostListener('document:click', ['$event']) //скрываем авторские батоны если нажато куда-то вне этого мини-рецепта
  clickout(event: any) {
    if (this.moreAuthorButtons)
      if (!this.eRef.nativeElement.contains(event.target)) {
        this.moreAuthorButtons = false;
      }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
