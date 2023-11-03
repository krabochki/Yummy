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
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { CommentService } from '../../../services/comment.service';
import { trigger } from '@angular/animations';
import { Clipboard } from '@angular/cdk/clipboard';
import { modal } from 'src/tools/animations';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';

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
  public currentUser: IUser = nullUser;
  public author: IUser = nullUser;
  public copyState = false; //скопирован ли текст комментария
  protected deleteCommentModalShow: boolean = false;
  protected reportCommentModalShow: boolean = false;
  protected successReportCommentModalShow: boolean = false;

  constructor(
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private notifyService: NotificationService,
    private clipboard: Clipboard,
    private commentService: CommentService,
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
        if (find) this.author = find;
      });
  }

  deleteComment() {
    if (this.recipe.reports) {
      this.recipe.reports = this.recipe.reports.filter(
        (item) => item.commentId !== this.comment.id,
      );
    }

    this.commentService
      .deleteComment(this.comment, this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        const author: IUser = this.author;
        const title =
          'Ты успешно удалил свой комментарий «' +
          this.comment.text +
          '» под рецептом «' +
          this.recipe.name +
          '»';

        const notify: INotification = this.notifyService.buildNotification(
          'Комментарий удален',
          title,
          'success',
          'comment',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService.sendNotification(notify, author).subscribe();
      });
  }

  likeComment() {
    this.commentService
      .likeComment(this.currentUser, this.comment, this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        const author: IUser = this.author;
        const title =
          'Твой комментарий «' +
          this.comment.text +
          '» под рецептом «' +
          this.recipe.name +
          '» понравился кулинару ' +
          (this.currentUser.fullName
            ? this.currentUser.fullName
            : '@' + this.currentUser.username);

        const notify: INotification = this.notifyService.buildNotification(
          'Комментарий кому-то понравился',
          title,
          'info',
          'comment',
          '/cooks/list/' + this.currentUser.id,
        );
        this.notifyService.sendNotification(notify, author).subscribe();
      });
  }
  dislikeComment() {
    this.commentService
      .dislikeComment(this.currentUser, this.comment, this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        const author: IUser = this.author;
        const title =
          'Твой комментарий «' +
          this.comment.text +
          '» под рецептом «' +
          this.recipe.name +
          '» не понравился кулинару ' +
          (this.currentUser.fullName
            ? this.currentUser.fullName
            : '@' + this.currentUser.username);

        const notify: INotification = this.notifyService.buildNotification(
          'Комментарий кому-то не понравился',
          title,
          'info',
          'comment',
          '/cooks/list/' + this.currentUser.id,
        );
        this.notifyService.sendNotification(notify, author).subscribe();
      });
  }

  reportComment() {
    this.reportCommentModalShow = false;

    this.commentService
      .reportComment(this.comment, this.recipe, this.currentUser)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.successReportCommentModalShow = true;
        let author: IUser = this.author;
        let title =
          'Кто-то пожаловался на твой комментарий «' +
          this.comment.text +
          '» под рецептом «' +
          this.recipe.name +
          '»';

        let notify: INotification = this.notifyService.buildNotification(
          'Кто-то пожаловался на комментарий',
          title,
          'warning',
          'comment',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService.sendNotification(notify, author).subscribe();

        author = this.currentUser;
        title =
          'Ты отправил жалобу на комментарий кулинара '+ (this.author.fullName?this.author.fullName:('@'+this.author.username)) + ' «' +
          this.comment.text +
          '» под рецептом «' +
          this.recipe.name +
          '»';

        notify = this.notifyService.buildNotification(
          'Ты пожаловался на комментарий',
          title,
          'success',
          'comment',
          '/recipes/list/' + this.recipe.id,
        );
        this.notifyService.sendNotification(notify,author).subscribe()

      });
  }

  get date() {
    return new Date(this.comment.date);
  }

  get haveReport(): boolean {
    return !!this.recipe?.reports?.find(
      (item) =>
        item.reporterId === this.currentUser.id &&
        item.commentId === this.comment.id,
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
      this.successReportCommentModalShow = true;
    }
  }

  handleSuccessReportCommentModal() {
    this.successReportCommentModalShow = false;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
