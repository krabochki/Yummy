import { Injectable } from '@angular/core';
import { IComment, nullComment } from 'src/app/modules/recipes/models/comments';
import { IRecipe } from '../models/recipes';
import { RecipeService } from './recipe.service';
import { IUser } from '../../user-pages/models/users';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(private recipeService: RecipeService) {}

  makeComment(user: IUser, content: string): IComment {
    const comment: IComment = {
      ...nullComment,
      text: content,
      authorId: user.id,
      date: new Date().toJSON(),
    };
    return comment;
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
    })
   return this.recipeService.updateRecipe(recipe)
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
