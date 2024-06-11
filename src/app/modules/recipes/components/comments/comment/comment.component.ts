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
  Subject,
  Subscription,
  catchError,
  finalize,
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
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { formatNumber } from 'src/tools/common';

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
  noAvatar = '/assets/images/userpic.png';
  public copyState = false; //скопирован ли текст комментария
  protected deleteCommentModalShow: boolean = false;
  protected reportCommentModalShow: boolean = false;
  protected successReportCommentModalShow: boolean = false;
  protected noAccessModalShow: boolean = false;
  loading = false;

  subscriptions = new Subscription();
  reportExistModal = false;

  constructor(
    private reportService: ReportService,
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
  this.subscriptions.add( this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUser = data;
      }))
    
  }

  deleteComment() {
    this.loading = true;
    this.cd.markForCheck();
    this.commentService
      .deleteComment(this.comment.id)
      .pipe(
        tap(() => {
          this.recipe.comments = this.recipe.comments.filter(c => c.id !== this.comment.id);
          if (this.recipe.commentsLength) this.recipe.commentsLength--;
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
    if (this.currentUser.id === this.comment.authorId) {
      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.YourCommentDeleted,
        )
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          'Комментарий удален',
          `Ты успешно удалил свой комментарий «${this.comment.text}» под рецептом «${this.recipe.name}»`,
          'success',
          'comment',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService
          .sendNotification(notify, this.comment.authorId, true)
          .subscribe();
      }
    } else {
      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.WorkNotifies,
        )
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          'Вы удалили комментарий',
          `Вы успешно удалили комментарий «${
            this.comment.text
          }» автора ${this.comment.authorName} под рецептом «${this.recipe.name}»`,
          'success',
          'comment',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService
          .sendNotification(notify, this.currentUser.id, true)
          .subscribe();
      }
      if (
        this.userService.getLimitation(
          this.comment.authorId,
          Permission.YourCommentReported,
        )
      ) {
        const notify: INotification = this.notifyService.buildNotification(
          'Ваш комментарий был удален',
          `Ваш комментарий «${this.comment.text}» под рецептом «${this.recipe.name}» был удален из-за нарушения правил сайта`,
          'error',
          'comment',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService
          .sendNotification(notify, this.comment.authorId)
          .subscribe();
      }
    }
  }

  formatNumber(number:number) {
    return formatNumber(number)
  }

  deleteLikeAfterDislike() {
    this.commentService
      .deleteLike( this.comment.id)
      .pipe(
        tap(() => {
          this.commentService
            .deleteLike(this.comment.id)
            .subscribe();
          this.commentService.dislikeComment(
            this.comment,
            this.recipe,
          );

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
              .sendNotification(notify, this.comment.authorId)
              .subscribe();
          }
        }),
      )
      .subscribe();
  }

  deleteDislikeAfterLike() {
    this.commentService
      .deleteDislike( this.comment.id)
      .pipe(
        tap(() => {
          this.commentService
            .deleteDislike( this.comment.id)
            .subscribe();
          this.commentService.likeComment(this.comment, this.recipe);
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
              .sendNotification(notify, this.comment.authorId)
              .subscribe();
          }
        }),
      )
      .subscribe();
  }

  likeComment() {
    if (!this.comment.liked) {
      this.commentService
        .postLike( this.comment.id)
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
        .deleteLike( this.comment.id)
        .pipe(
          tap(() => {
            this.commentService.deleteLikeFromComment(
              this.comment,
              this.recipe,
            );
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  dislikeComment() {
    if (!this.comment.disliked) {
      this.commentService
        .postDislike( this.comment.id)
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
        .deleteDislike( this.comment.id)
        .pipe(
          tap(() => {
            this.commentService.deleteDislikeFromComment(
              this.currentUser,
              this.comment,
              this.recipe,
            );
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
      .postReport(this.comment.id)
      .pipe(
        catchError((res) => {
          if (res.error.info === 'Запись уже существует') {
            this.reportExistModal = true;
          }
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
        tap(() => {
          this.recipe.comments.map((c) => {
            if (c.id === this.comment.id) {
              c.reported = true;
            }
          });

          this.cd.markForCheck();
          this.successReportCommentModalShow = true;
        }),
      )
      .subscribe();
  }
  sendNotifiesAfterReportingComment() {
    this.userService
      .getLimitation(this.comment.authorId, Permission.YourCommentReported)
      .pipe(
        tap((limit) => {
          if (!limit) {
            const notify: INotification = this.notifyService.buildNotification(
              'Кто-то пожаловался на комментарий',
              `Кто-то пожаловался на твой комментарий «${this.comment.text}» под рецептом «${this.recipe.name}». Жалоба ожидает рассмотрения.`,
              'warning',
              'comment',
              '/recipes/list/' + this.recipe.id,
            );
            this.notifyService
              .sendNotification(notify, this.comment.authorId)
              .subscribe();
          }
        }),
      )
      .subscribe();

    if (
      this.userService.getPermission(
        this.currentUser.limitations || [],
        Permission.YouReportedComment,
      )
    ) {
      const notify = this.notifyService.buildNotification(
        'Ты пожаловался на комментарий',
        `Ты отправил жалобу на комментарий ${
          'кулинара ' +
          (this.comment.authorName)
        } «${this.comment.text}» под рецептом «${this.recipe.name}»`,
        'success',
        'comment',
        '/recipes/list/' + this.recipe.id,
      );
      this.notifyService
        .sendNotification(notify, this.currentUser.id, true)
        .subscribe();
    }
  }

  get date() {
    return new Date(this.comment.date);
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
      this.deleteComment();
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
    this.subscriptions.unsubscribe();
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }
}
