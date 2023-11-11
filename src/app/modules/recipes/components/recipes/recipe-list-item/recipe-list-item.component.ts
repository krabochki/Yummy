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
import { Subject, takeUntil } from 'rxjs';
import { getCurrentDate } from 'src/tools/common';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { CalendarService } from 'src/app/modules/planning/services/calendar.service';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
import { IPlan } from 'src/app/modules/planning/models/plan';
import { AdminService } from 'src/app/modules/authentication/services/admin.service';

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

  protected editMode: boolean = false;
  protected isRecipeFavorite: boolean = false;
  protected isRecipeLiked: boolean = false;
  protected isRecipeCooked: boolean = false;
  protected dataLoaded = false;
  protected currentUser: IUser = { ...nullUser };
  protected author: IUser = { ...nullUser };

  private vote: boolean = false;

  protected isAwaitingApprove: boolean = false;
  private editedRecipe: IRecipe = nullRecipe;

  protected noAccessModalShow: boolean = false;
  protected deleteRecipeModalShow: boolean = false;
  protected successDeleteModalShow: boolean = false;
  protected successEditModalShow: boolean = false;
  protected moreAuthorButtons: boolean = false;
  protected publishModalShow: boolean = false;
  protected successPublishModalShow: boolean = false;
  protected voteModalShow: boolean = false;
  private users: IUser[] = [];
  protected successVoteModalShow: boolean = false;

  private plans: IPlan[] = [];

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private planService: PlanService,
    private notifyService: NotificationService,
    private eRef: ElementRef,
    private adminService:AdminService
  ) {}

  ngOnInit() {
    this.currentUserInit();
    this.usersInit();
  }

  private currentUserInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedCurrentUser) => {
        if (receivedCurrentUser.id) {
          this.currentUser = receivedCurrentUser;
          this.recipesInit();
        }
      });
  }
  private recipesInit(): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receiverRecipes) => {
        const findedRecipe = receiverRecipes.find((recipe) => {
          return recipe.id === this.recipe.id;
        });
        if (findedRecipe) this.recipe = findedRecipe;
        if (this.currentUser.id !== 0) {
          this.isRecipeLiked = this.recipe.likesId.includes(
            this.currentUser.id,
          );
          this.isRecipeCooked = this.recipe.cooksId.includes(
            this.currentUser.id,
          );
          this.isRecipeFavorite = this.recipe.favoritesId.includes(
            this.currentUser.id,
          );
        }
        this.cd.markForCheck();
      });
  }
  private usersInit(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((users) => {
        this.users = users;
        const findedAuthor = users.find((user) => {
          if (user.id === this.recipe.authorId) return true;
          else return false;
        });
        if (findedAuthor) this.author = findedAuthor;
        this.plansInit();
        this.dataLoaded = true;
        this.cd.markForCheck();
      });
  }
  private plansInit(): void {
    this.planService.plans$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedPlans) => {
        this.plans = receivedPlans;
      });
  }

  //добавляем рецепт в избранное
  makeThisRecipeFavorite() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeFavorite = !this.isRecipeFavorite;
    this.recipe = this.isRecipeFavorite
      ? this.recipeService.addRecipeToFavorites(
          this.currentUser.id,
          this.recipe,
        )
      : this.recipeService.removeRecipeFromFavorites(
          this.currentUser.id,
          this.recipe,
        );

    this.recipeService
      .updateRecipe(this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        if (
          this.isRecipeFavorite &&
          this.recipe.authorId !== this.currentUser.id
          && this.userService.getPermission('fav-on-your-recipe',this.author)
        ) {
          const author: IUser = this.author;
          const title =
            'Твой рецепт «' + this.recipe.name + '» кто-то добавил в избранное';

          const notify: INotification = this.notifyService.buildNotification(
            'Твой рецепт добавили в избранное',
            title,
            'info',
            'recipe',
            '/recipes/list/' + this.recipe.id,
          );
          this.notifyService.sendNotification(notify, author).subscribe();
        }
      });
  }

  //лайкаем рецепт
  likeThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeLiked = !this.isRecipeLiked;

    this.recipe = this.isRecipeLiked
      ? this.recipeService.likeRecipe(this.currentUser.id, this.recipe)
      : this.recipeService.unlikeRecipe(this.currentUser.id, this.recipe);

    this.recipeService
      .updateRecipe(this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        () => {
          if (
            this.isRecipeLiked &&
            this.recipe.authorId !== this.currentUser.id &&
            this.userService.getPermission('like-on-your-recipe', this.author)
          ) {
            const author: IUser = this.author;
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
            this.notifyService.sendNotification(notify, author).subscribe();
          }
        },
        (error: Error) =>
          console.error('Ошибка оценки рецепта: ' + error.message),
      );
  }
  //готовим рецепт
  cookThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeCooked = !this.isRecipeCooked;

    this.recipe = this.isRecipeCooked
      ? this.recipeService.cookRecipe(this.currentUser.id, this.recipe)
      : this.recipeService.uncookRecipe(this.currentUser.id, this.recipe);

    if (!this.isRecipeCooked) {
      this.recipe = this.recipeService.removeVote(
        this.recipe,
        this.currentUser.id,
      );
      this.recipeService
        .updateRecipe(this.recipe)
        .pipe(takeUntil(this.destroyed$))
        .subscribe();
    }
    if (this.isRecipeCooked) this.successVoteModalShow = true;
  }

  handlePublishRecipeModal(event: boolean) {
    if (event) {
      this.successPublishModalShow = true;
    }
    this.publishModalShow = false;
  }
  handleSuccessPublishModal() {
      this.successPublishModalShow = false;

    if (this.currentUser.role === 'user') {
      this.recipe.status = 'awaits';
      this.recipe.publicationDate = getCurrentDate();
 

      this.recipeService.updateRecipe(this.recipe).subscribe(() => {
        if (
          this.userService.getPermission('you-publish-recipe', this.author)
        ) {
          const notify: INotification = this.notifyService.buildNotification(
            'Рецепт отправлен на проверку',
            `Рецепт «${this.recipe.name}» успешно отправлен на проверку`,
            'success',
            'recipe',
            '/recipes/list/' + this.recipe.id,
          );
          this.notifyService.sendNotification(notify, this.author).subscribe();
        }
      });
      
    }
    else {
      this.recipe.status = 'public';
      this.recipe.publicationDate = getCurrentDate();
      this.recipeService.updateRecipe(this.recipe).subscribe();

      if (
        this.userService.getPermission('manager-review-your-recipe', this.author)
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          'Рецепт успешно опубликован',
          `Рецепт «${this.recipe.name}» успешно опубликован и теперь доступен всем кулинарам для просмотра`,
          'success',
          'recipe',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService.sendNotification(notify, this.author).subscribe();
      
      }
    }
  }
  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }
  handleEditedRecipe(event: IRecipe) {
    this.editMode = false;
    this.editedRecipe = event;
    if (this.editedRecipe.status === 'awaits') {
      this.isAwaitingApprove = true;
    }
    this.successEditModalShow = true;
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

    setTimeout(() => {
         this.recipeService
           .updateRecipe(this.recipe)
           .pipe(takeUntil(this.destroyed$))
           .subscribe(() => {
             if (
               this.isRecipeCooked &&
               this.recipe.authorId !== this.currentUser.id &&
               this.userService.getPermission(
                 'cook-on-your-recipe',
                 this.author,
               )
             ) {
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
               this.notifyService
                 .sendNotification(notify, this.author)
                 .subscribe();
             }

             this.vote = false;
           });
    }, 300);

 
  }
  handleDeleteRecipeModal(event: boolean) {
    if (event) {
      this.successDeleteModalShow = true;
    }
    this.deleteRecipeModalShow = false;
  }
  handleSuccessEditModal() {
    //?????????????? если наоборот сначала обновить то это модальное окно пропускается
    this.recipeService.updateRecipe(this.editedRecipe).subscribe(() => {
      if (this.userService.getPermission('you-edit-your-recipe', this.currentUser)) {
        const notify: INotification = this.notifyService.buildNotification(
          this.isAwaitingApprove
            ? 'Рецепт изменен и отправлен на проверку'
            : 'Рецепт изменен',
          `Рецепт «${this.editedRecipe.name}» изменен ${this.isAwaitingApprove ? ' и успешно отправлен на проверку' : ''
          }`,
          'success',
          'recipe',
          '/recipes/list/' + this.editedRecipe.id,
        );
        this.notifyService.sendNotification(notify, this.currentUser).subscribe();
      }

      this.router.navigateByUrl('recipes/list/' + this.editedRecipe.id);
    });
  }
  handleSuccessDeleteModal() {
    this.planService.updatePlansAfterDeletingRecipe(
      this.plans,
      this.users,
      this.recipe,
    );

    if(this.userService.getPermission('you-delete-your-recipe',this.author))
    this.notifyService
      .sendNotification(
        this.notifyService.buildNotification(
          'Твой рецепт удален',
          `Вы успешно удалили свой рецепт «${this.recipe.name}».`,
          'success',
          'recipe',
          '',
        ),
        this.author,
      ).subscribe();
    this.recipeService.deleteRecipe(this.recipe).subscribe();
  }

  @HostListener('document:click', ['$event']) //скрываем авторские батоны если нажато куда-то вне этого мини-рецепта
  clickout(event: any) {
    if(this.moreAuthorButtons)
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.moreAuthorButtons = false;
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
