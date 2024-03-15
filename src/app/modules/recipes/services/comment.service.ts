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
        if (!comment.disliked) {
          comment.disliked = true;
          comment.dislikesLength++;
        }
        if (comment.liked) {
          comment.liked = false;
          comment.likesLength--;
        }
      }
    });
  }

  likeComment(comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        if (!comment.liked) {
          comment.liked = true;
          comment.likesLength++;
        }
        if (comment.disliked) {
          comment.disliked = false;
          comment.dislikesLength--;
        }
      }
    });
  }

  deleteLikeFromComment(comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        comment.liked=false
      }
    });
  }

  deleteDislikeFromComment(user: IUser, comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        comment.disliked = false
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

  getComments(recipeId: number, userId:number, limit: number, page: number) {
    return this.http.get<{ comments: IComment[]; count: number }>(
      `${this.commentsUrl}/recipe-comments/${recipeId}/${userId}?limit=${limit}&page=${page}`,
    );
  }

  postComment(comment: IComment, recipe: IRecipe) {
    comment.recipeId = recipe.id;
    return this.http.post(this.commentsUrl, comment);
  }

  
}
