import {
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
import { formatNumber } from 'src/tools/common';

@Component({
  selector: 'app-recipe-list-item',
  templateUrl: './recipe-list-item.component.html',
  styleUrls: ['./recipe-list-item.component.scss'],
  animations: [trigger('modal', modal())],
})
export class RecipeListItemComponent implements OnInit, OnDestroy {
  @Input() recipe: IRecipe = nullRecipe;
  @Input() showAuthor: boolean = true;
  @Input() shortView: boolean = false;

  protected destroyed$: Subject<void> = new Subject<void>();

  protected currentUser: IUser = { ...nullUser };

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
  }

  private currentUserInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedCurrentUser) => {
        this.currentUser = receivedCurrentUser;
      });
  }
  
  
  formatNumber(number:number) {
   return formatNumber(number)
  }

  //добавляем рецепт в избранное
  makeThisRecipeFavorite() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    if (!this.recipe.faved) {
      this.recipeService
        .pushToFavorites(this.recipe.id)
        .pipe(
          tap(() => {
            this.recipe.faved = true;
            this.cd.markForCheck();
            
    const authorId = this.recipe.authorId;
    if (this.recipe.faved && authorId > 0 && authorId !== this.currentUser.id) {
      this.userService
        .getLimitation(authorId, Permission.YourRecipeFaved)
        .subscribe((limit) => {
          if (!limit) {
            const title =
              'Твой рецепт «' +
              this.recipe.name +
              '» кто-то добавил в избранное';

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
        
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .removeFromFavorites(this.recipe.id)
        .pipe(
          tap(() => {
            this.recipe.faved = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }

  }

  //лайкаем рецепт
  likeThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }


    if (!this.recipe.liked) {
      this.recipeService
        .setLike(this.recipe.id)
        .pipe(
          tap(() => {
            this.recipe.liked = true;
            this.recipe.likesLength++;
            this.cd.markForCheck();

            const authorId = this.recipe.authorId;

            if (authorId > 0 && authorId !== this.currentUser.id) {
              this.userService
                .getLimitation(authorId, Permission.YourRecipeLiked)
                .subscribe((limit) => {
                  if (!limit) {
                    const notify: INotification =
                      this.notifyService.buildNotification(
                        'Твой рецепт оценили',
                        `Твой рецепт «${
                          this.recipe.name
                        }» понравился кулинару ${
                          this.currentUser.fullName
                            ? this.currentUser.fullName
                            : '@' + this.currentUser.username
                        }`,
                        'info',
                        'recipe',
                        '/cooks/list/' + this.currentUser.id,
                      );
                    this.notifyService
                      .sendNotification(notify, authorId)
                      .subscribe();
                  }
                });
            }
          }),
        )
        .subscribe();
    } else {
      this.recipeService
        .unsetLike(this.recipe.id)
        .pipe(
          tap(() => {
            this.recipe.liked = false;
            this.recipe.likesLength--;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
    
  }

  cookThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }


    if (!this.recipe.cooked) {
      const subscribes: Observable<any>[] = [];
      subscribes.push(
        this.recipeService.setCook(this.recipe.id),
      );
      subscribes.push(
        this.recipeService.pushVoteForRecipe(
          this.recipe.id,
          this.vote,
        ),
      );
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            this.recipe.cooked = true;
            this.recipe.cooksLength++;
            this.successVoteModalShow = true;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    } else {
      const subscribes: Observable<any>[] = [];
      subscribes.push(
        this.recipeService.removeVoteForRecipe(
          this.recipe.id,
        ),
      );
      subscribes.push(
        this.recipeService.unsetCook(this.recipe.id),
      );
      forkJoin(subscribes)
        .pipe(
          tap(() => {
            this.recipe.cooked = false;
            this.recipe.cooksLength--;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }

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
      !!event,
    );
    this.vote = event;
    this.cookThisRecipe();
    this.voteModalShow = false;
  }

  handleSuccessVoteModal() {
    this.successVoteModalShow = false;

    const authorId = this.recipe.authorId;
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
