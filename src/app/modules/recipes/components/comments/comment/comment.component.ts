import {
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

import localeRu from '@angular/common/locales/ru';
import { registerLocaleData } from '@angular/common';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { CommentService } from '../../../services/comment.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit, OnDestroy {
  @Input() comment: IComment = nullComment;
  @Input() recipe: IRecipe = nullRecipe;
  protected destroyed$: Subject<void> = new Subject<void>();
  public currentUser: IUser = nullUser;
  public author: IUser = nullUser;

  get date() {
    return new Date(this.comment.date);
  }

  constructor(
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private recipeService: RecipeService,
    private commentService: CommentService,
  ) {}

  public ngOnInit(): void {
    registerLocaleData(localeRu);
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

  likeComment() {
    this.commentService
      .likeComment(this.currentUser, this.comment, this.recipe)
      .subscribe();
  }
  dislikeComment() {
    this.commentService
      .dislikeComment(this.currentUser, this.comment, this.recipe)
      .subscribe();
  }


  copyState = false;

  copy() {
    const textArea = document.createElement('textarea');
    textArea.value = this.comment.text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.copyState = true;
    } catch (error) {}
    document.body.removeChild(textArea);
    setTimeout(() => {
      this.copyState = false;
      this.cd.markForCheck();
    }, 3000);
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
