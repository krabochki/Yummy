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

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(private recipeService: RecipeService, private userService:UserService) {}

  makeComment(user: IUser, content: string): IComment {
    const comment: IComment = {
      ...nullComment,
      text: content,
      authorId: user.id,
      date: new Date().toJSON(),
    };
    return comment;
  }

  deleteComment(comment: IComment, recipe: IRecipe) {
    recipe.comments = recipe.comments.filter((item) => item.id !== comment.id);
    return this.recipeService.updateRecipe(recipe);
  }
  sortComments(comments: IComment[]): IComment[] {
    return comments.sort((commentA, commentB) => {
      if (commentA.date < commentB.date) return 1;
      if (commentA.date > commentB.date) return -1;
      else return 0;
    });
  }
  reportComment(comment: IComment, recipe: IRecipe, reporter: IUser) {
    let maxId: number = 0;
    if (recipe.reports) {
      maxId = recipe.reports.reduce((max, c) => (c.id > max ? c.id : max), 0);
    }

    const report: ICommentReport = {
      id: maxId + 1,
      date: new Date().toJSON(),
      reporter: reporter.id,
      comment: comment.id,
    };
    if (!recipe.reports) recipe.reports = [];
    recipe.reports.push(report);
    return this.recipeService.updateRecipe(recipe);
  }

  showAuthor(author: IUser, currentUser: IUser): boolean{
    return (currentUser.id === author.id) || (author.role !== 'admin' && currentUser.role !== 'user') || this.userService.getPermission('comment-author', author)
  }

  likeComment(user: IUser, comment: IComment, recipe: IRecipe) {
    const updatedComments = recipe.comments.map((item) => {
      if (comment.id === item.id) {
        if (!comment.likesId.includes(user.id)) {
          comment.likesId.push(user.id);
        } else {
          comment.likesId = comment.likesId.filter((id) => id !== user.id);
        }
        if (comment.dislikesId.includes(user.id)) {
          comment.dislikesId = comment.dislikesId.filter(
            (id) => id !== user.id,
          );
        }
      }
    });
    return this.recipeService.updateRecipe(recipe);
  }

  dislikeComment(user: IUser, comment: IComment, recipe: IRecipe) {
    const updatedComments = recipe.comments.map((item) => {
      if (comment.id === item.id) {
        if (!comment.dislikesId.includes(user.id)) {
          comment.dislikesId.push(user.id);
        } else {
          comment.dislikesId = comment.dislikesId.filter(
            (id) => id !== user.id,
          );
        }
        if (comment.likesId.includes(user.id)) {
          comment.likesId = comment.likesId.filter((id) => id !== user.id);
        }
      }
    });
    return this.recipeService.updateRecipe(recipe);
  }

  addCommentToRecipe(recipe: IRecipe, comment: IComment) {
    const maxId = recipe.comments.reduce(
      (max, c) => (c.id > max ? c.id : max),
      0,
    );
    comment.id = maxId + 1;

    if (recipe.comments) {
      recipe.comments.push(comment);
    } else {
      recipe.comments = [comment];
    }
    return this.recipeService.updateRecipe(recipe);
  }

  removeCommentFromRecipe(recipe: IRecipe, commentId: number) {
    if (recipe.comments) {
      recipe.comments = recipe.comments.filter(
        (comment) => comment.id !== commentId,
      );
    }
    return this.recipeService.updateRecipe(recipe);
  }
}
