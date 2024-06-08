import { Injectable } from '@angular/core';
import {
  IComment,
  nullComment,
} from 'src/app/modules/recipes/models/comments';
import { IRecipe } from '../models/recipes';
import { IUser } from '../../user-pages/models/users';
import { commentsSource } from 'src/tools/sourses';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(
    private http: HttpClient,
  ) {}

  makeComment(userId:number, content: string, authorName:string, avatarUrl?: string): IComment {
    const comment: IComment = {
      ...nullComment,
      text: content,
      authorName: authorName,
      authorId: userId,
      date: new Date().toJSON(),
      avatarUrl: avatarUrl
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

  

  dislikeComment(comment: IComment, recipe: IRecipe) {
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
        comment.liked = false;
        comment.likesLength--;
      }
    });
  }

  deleteDislikeFromComment(user: IUser, comment: IComment, recipe: IRecipe) {
    recipe.comments.map((item) => {
      if (comment.id === item.id) {
        comment.disliked = false;
        comment.dislikesLength--;
      }
    });
  }

  postLike(commentId: number) {
            const options = { withCredentials: true };
    return this.http.post(`${this.commentsUrl}/like`, {
      commentId: commentId,
    }, options);
  }

  deleteLike( commentId: number) {
    const options = { withCredentials: true };
    return this.http.delete(`${this.commentsUrl}/like/${commentId}`, options);
  }

  getComment(commentId: number) {
    
    return this.http.get<IComment>(`${this.commentsUrl}/short-comment/${commentId}`);
  }




  postDislike(commentId: number) {
    const options = { withCredentials: true };
    return this.http.post(`${this.commentsUrl}/dislike`, {
      commentId: commentId,
    },options);
  }

  deleteDislike(commentId: number) {
    const options = { withCredentials: true };
    return this.http.delete(
      `${this.commentsUrl}/dislike/${commentId}`,
     options);
  }

  deleteComment(commentId: number) {
        const options = { withCredentials: true };

    return this.http.delete(`${this.commentsUrl}/comment/${commentId}`, options);
  }

  commentsUrl: string = commentsSource;

  getComments(recipeId: number, limit: number, page: number) {
    const options = { withCredentials: true };
    return this.http.get<{ comments: IComment[]; count: number }>(
      `${this.commentsUrl}/recipe-comments/${recipeId}?limit=${limit}&page=${page}`, options
    );
  }

  postComment(comment: IComment, recipe: IRecipe) {
        const options = { withCredentials: true };

    comment.recipeId = recipe.id;
    return this.http.post(this.commentsUrl, comment, options);
  }

  
}
