import {
  ISection,
  nullSection,
} from 'src/app/modules/recipes/models/categories';
import {
  ICommentReportForAdmin,
  IComment,
  nullComment,
} from 'src/app/modules/recipes/models/comments';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';

export function getAuthorOfReportedComment(
  report: ICommentReportForAdmin,
  users: IUser[],
  recipes: IRecipe[],
): IUser {
  return getUser(
    getComment(report.comment, getRecipe(report.recipe, recipes)).authorId,
    users,
  );
}
export function getUser(userId: number, users: IUser[]): IUser {
  return users.find((item) => item.id === userId) || nullUser;
}
export function getSection(category: number, sections: ISection[]): ISection {
  return (
    sections.find((section) => section.categoriesIds.includes(category)) ||
    nullSection
  );
}
export function getComment(commentId: number, recipe: IRecipe): IComment {
  return recipe.comments.find((item) => item.id === commentId) || nullComment;
}
export function getRecipe(recipeId: number, recipes: IRecipe[]): IRecipe {
  return recipes.find((item) => item.id === recipeId) || nullRecipe;
}
