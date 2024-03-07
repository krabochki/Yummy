import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { IComment, nullComment } from '../../../models/comments';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  forkJoin,
  takeUntil,
  tap,
} from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { CommentService } from '../../../services/comment.service';
import { trigger } from '@angular/animations';
import { Clipboard } from '@angular/cdk/clipboard';
import { modal } from 'src/tools/animations';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { Router } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { ReportService } from '../../../services/report.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentComponent implements OnInit, OnDestroy {
  @Input() comment: IComment = nullComment;
  @Input() recipe: IRecipe = nullRecipe;
  protected destroyed$: Subject<void> = new Subject<void>();
  public currentUser: IUser = { ...nullUser };
  avatar = '';
  noAvatar = '/assets/images/userpic.png';
  public author: IUser = { ...nullUser };
  public copyState = false; //скопирован ли текст комментария
  protected deleteCommentModalShow: boolean = false;
  protected reportCommentModalShow: boolean = false;
  protected successReportCommentModalShow: boolean = false;
  protected noAccessModalShow: boolean = false;
  loading = false;

  reportExistModal = false;

  constructor(
    private reportService:ReportService,
    private userService: UserService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private notifyService: NotificationService,
    private clipboard: Clipboard,
    private commentService: CommentService,
    private recipeService: RecipeService,
  ) {}

  public ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
      });
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser[]) => {
        const find: IUser | undefined = data.find(
          (user) => user.id === this.comment.authorId,
        );
        if (find) {
          this.author = find;
          if (this.author.avatarUrl) {
            this.avatar = this.author.avatarUrl;
          }
        }
      });
  }

  deleteComment() {
    this.loading = true;
    this.cd.markForCheck();
    this.commentService
      .deleteComment(this.comment.id)
      .pipe(
        tap(() => {
          this.recipe = this.commentService.removeCommentFromRecipe(
            this.comment.id,
            this.recipe,
          );
          this.recipeService.updateRecipeInRecipes(this.recipe);
          this.sendNotifyAfterDeletingComment();
        }),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe();
  }

  sendNotifyAfterDeletingComment() {
    // if (
    //   this.userService.getPermission('you-delete-your-comment', this.author)
    // ) {
      const notify: INotification = this.notifyService.buildNotification(
        'Комментарий удален',
        `Ты успешно удалил свой комментарий «${this.comment.text}» под рецептом «${this.recipe.name}»`,
        'success',
        'comment',
        '/recipes/list/' + this.recipe.id,
      );
      this.notifyService
        .sendNotification(notify, this.author.id,true)
      
        .subscribe();
   // }
  }

  deleteLikeAfterDislike() {
    this.commentService
      .deleteLike(this.currentUser.id, this.comment.id)
      .pipe(
        tap(() => {
          this.commentService
            .deleteLike(this.currentUser.id, this.comment.id)
            .subscribe();
          this.commentService.dislikeComment(
            this.currentUser,
            this.comment,
            this.recipe,
          );

          this.recipeService.updateRecipeInRecipes(this.recipe);
          this.cd.markForCheck();

          if (
            this.comment.authorId !== this.currentUser.id //&&
           // this.userService.getPermission('your-commented-liked', this.author)
          ) {
            const notify: INotification = this.notifyService.buildNotification(
              'Комментарий кому-то не понравился',
              `Твой комментарий «${this.comment.text}» под рецептом «${
                this.recipe.name
              }» не понравился кулинару
            ${
              this.currentUser.fullName
                ? this.currentUser.fullName
                : '@' + this.currentUser.username
            }`,
              'info',
              'comment',
              '/cooks/list/' + this.currentUser.id,
            );
            this.notifyService
              .sendNotification(notify, this.author.id)
              .subscribe();
          }
        }),
      )
      .subscribe();
  }

  deleteDislikeAfterLike() {
    this.commentService
      .deleteDislike(this.currentUser.id, this.comment.id)
      .pipe(
        tap(() => {
          this.commentService
            .deleteDislike(this.currentUser.id, this.comment.id)
            .subscribe();
          this.commentService.likeComment(
            this.currentUser,
            this.comment,
            this.recipe,
          );

          this.recipeService.updateRecipeInRecipes(this.recipe);
          this.cd.markForCheck();

          if (
            this.comment.authorId !== this.currentUser.id //&&
            //this.userService.getPermission('your-commented-liked', this.author)
          ) {
            const notify: INotification = this.notifyService.buildNotification(
              'Комментарий кому-то понравился',
              `Твой комментарий «${this.comment.text}» под рецептом «${
                this.recipe.name
              }» понравился кулинару ${
                this.currentUser.fullName
                  ? this.currentUser.fullName
                  : '@' + this.currentUser.username
              }`,
              'info',
              'comment',
              '/cooks/list/' + this.currentUser.id,
            );
            this.notifyService
              .sendNotification(notify, this.author.id)
              .subscribe();
          }
        }),
      )
      .subscribe();
  }

  likeComment() {
    if (!this.comment.likesId.includes(this.currentUser.id)) {
      this.commentService
        .postLike(this.currentUser.id, this.comment.id)
        .pipe(
          catchError((response) => {
            if (response.error.info === 'Лайк уже добавлен') {
              this.deleteDislikeAfterLike();

              return EMPTY;
            } else {
              return response;
            }
          }),
          tap(() => {
            this.deleteDislikeAfterLike();
          }),
        )
        .subscribe();
    } else {
      this.commentService
        .deleteLike(this.currentUser.id, this.comment.id)
        .pipe(
          tap(() => {
            this.commentService.deleteLikeFromComment(
              this.currentUser,
              this.comment,
              this.recipe,
            );
            this.recipeService.updateRecipeInRecipes(this.recipe);
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  dislikeComment() {
    if (!this.comment.dislikesId.includes(this.currentUser.id)) {
      this.commentService
        .postDislike(this.currentUser.id, this.comment.id)
        .pipe(
          catchError((response) => {
            if (response.error.info === 'Дизлайк уже добавлен') {
              this.deleteLikeAfterDislike();
              return EMPTY;
            } else {
              return response;
            }
          }),
          tap(() => {
            this.deleteLikeAfterDislike();
          }),
        )
        .subscribe();
    } else {
      this.commentService
        .deleteDislike(this.currentUser.id, this.comment.id)
        .pipe(
          tap(() => {
            this.commentService.deleteDislikeFromComment(
              this.currentUser,
              this.comment,
              this.recipe,
            );
            this.recipeService.updateRecipeInRecipes(this.recipe);
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  reportComment() {
    this.loading = true;
    this.cd.markForCheck();

    this.reportService
      .postReport(this.comment.id, this.currentUser.id)
      .pipe(
        catchError((res) => {
          if (res.error.info === 'Запись уже существует')
          {
            this.reportExistModal = true;
          }
          return EMPTY; 
        }),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
        tap(
          () => {
            this.successReportCommentModalShow = true;
          }
        )
      )
      .subscribe();

  }
  sendNotifiesAfterReportingComment() {
    // if (
    //   this.userService.getPermission(
    //     'your-reports-reviewed-moderator',
    //     this.author,
    //   )
    // ) {
      let notify: INotification = this.notifyService.buildNotification(
        'Кто-то пожаловался на комментарий',
        `Кто-то пожаловался на твой комментарий «${this.comment.text}» под рецептом «${this.recipe.name}». Жалоба ожидает рассмотрения модератора`,
        'warning',
        'comment',
        '/recipes/list/' + this.recipe.id,
      );
      this.notifyService.sendNotification(notify, this.author.id).subscribe();
    //}

    // if (
    //   this.userService.getPermission('your-reports-publish', this.currentUser)
    // ) {
       notify = this.notifyService.buildNotification(
        'Ты пожаловался на комментарий',
        `Ты отправил жалобу на комментарий ${
          'кулинара ' +
          (this.author.fullName
            ? this.author.fullName
            : '@' + this.author.username)
        } «${this.comment.text}» под рецептом «${this.recipe.name}»`,
        'success',
        'comment',
        '/recipes/list/' + this.recipe.id,
      );
      this.notifyService
        .sendNotification(notify, this.currentUser.id,true)
      
        .subscribe();
    //}
  }

  get date() {
    return new Date(this.comment.date);
  }

  get haveReport(): boolean {
    return !!this.recipe?.reports?.find(
      (item) =>
        item.reporter === this.currentUser.id &&
        item.comment === this.comment.id,
    );
  }

  copy() {
    //копирование комментария
    this.clipboard.copy(this.comment.text);
    this.copyState = true;
    setTimeout(() => {
      this.copyState = false;
      this.cd.markForCheck();
    }, 3000);
  }

  handleDeleteCommentModal(result: boolean) {
    this.deleteCommentModalShow = false;

    if (result) {
      setTimeout(() => {
        this.deleteComment();
      }, 300);
    }
  }

  handleReportCommentModal(result: boolean) {
    this.reportCommentModalShow = false;

    if (result) {
      this.reportComment();
    }
  }

  handleSuccessReportCommentModal() {
    this.successReportCommentModalShow = false;
    this.sendNotifiesAfterReportingComment();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }
}
