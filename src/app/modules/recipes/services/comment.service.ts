import { Injectable } from '@angular/core';
import {
  IComment,
  ICommentReport,
  nullComment,
} from 'src/app/modules/recipes/models/comments';
import { IRecipe } from '../models/recipes';
import { RecipeService } from './recipe.service';
import { IUser } from '../../user-pages/models/users';
import { UserService } from '../../user-pages/services/user.service';
import { commentsSource } from 'src/tools/sourses';
import { HttpClient } from '@angular/common/http';
import { getCurrentDate } from 'src/tools/common';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
    private userService: UserService,
  ) {}

  makeComment(user: IUser, content: string): IComment {
    const comment: IComment = {
      ...nullComment,
      text: content,
      authorId: user.id,
      date: new Date().toJSON(),
    };
    return comment;
  }

  removeCommentFromRecipe(commentId: number, recipe: IRecipe) {
    const newComments = recipe.comments.filter(
      (comment) => comment.id !== commentId,
    );
    const newRecipe = { ...recipe, comments: newComments };
    return newRecipe;
  }

  sortComments(comments: IComment[]): IComment[] {
    return comments.sort((commentA, commentB) => {
      if (commentA.date < commentB.date) return 1;
      if (commentA.date > commentB.date) return -1;
      else return 0;
    });
  }

  dislikeComment(user: IUser, comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        if (!comment.dislikesId.includes(user.id)) {
          comment.dislikesId.push(user.id);
        }
        if (comment.likesId.includes(user.id)) {
          comment.likesId = comment.likesId.filter((id) => id !== user.id);
        }
      }
    });
  }

  likeComment(user: IUser, comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        if (!comment.likesId.includes(user.id)) {
          comment.likesId.push(user.id);
        }
        if (comment.dislikesId.includes(user.id)) {
          comment.dislikesId = comment.dislikesId.filter(
            (id) => id !== user.id,
          );
        }
      }
    });
  }

  deleteLikeFromComment(user: IUser, comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        comment.likesId = comment.likesId.filter(
          (userId) => userId !== user.id,
        );
      }
    });
  }

  deleteDislikeFromComment(user: IUser, comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        comment.dislikesId = comment.dislikesId.filter(
          (userId) => userId !== user.id,
        );
      }
    });
  }

  postLike(userId: number, commentId: number) {
    return this.http.post(`${this.commentsUrl}/like`, {
      userId: userId,
      commentId: commentId,
    });
  }

  deleteLike(userId: number, commentId: number) {
    return this.http.delete(`${this.commentsUrl}/like/${userId}/${commentId}`);
  }

  getComment(commentId:number) {
    return this.http.get<IComment>(`${this.commentsUrl}/short-comment/${commentId}`);
  }

  getLikes(commentId: number) {
    return this.http.get<number[]>(`${this.commentsUrl}/like/${commentId}`);
  }

  getDislikes(commentId: number) {
    return this.http.get<number[]>(`${this.commentsUrl}/dislike/${commentId}`);
  }

  postDislike(userId: number, commentId: number) {
    return this.http.post(`${this.commentsUrl}/dislike`, {
      userId: userId,
      commentId: commentId,
    });
  }

  deleteDislike(userId: number, commentId: number) {
    return this.http.delete(
      `${this.commentsUrl}/dislike/${userId}/${commentId}`,
    );
  }

  deleteComment(commentId: number) {
    return this.http.delete(`${this.commentsUrl}/comment/${commentId}`);
  }

  commentsUrl: string = commentsSource;

  getComments(recipeId: number, limit: number, page: number) {
    return this.http.get<{ comments: IComment[]; count: number }>(
      `${this.commentsUrl}/${recipeId}?limit=${limit}&page=${page}`,
    );
  }

  postComment(comment: IComment, recipe: IRecipe) {
    comment.recipeId = recipe.id;
    return this.http.post(this.commentsUrl, comment);
  }

  translateComments(comments: IComment[]): IComment[] {
    comments.forEach((comment) => {
      comment.dislikesId = comment.dislikesId || [];
      comment.likesId = comment.likesId || [];
    });
    return comments;
  }
}
