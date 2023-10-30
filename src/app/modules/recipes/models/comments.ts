import { IRecipe } from "./recipes";

  


  export interface IComment {
    id: number; // Уникальный идентификатор комментария
    text: string; // Текст комментария
    authorId: number; // Уникальный идентификатор автора комментария
    date: string; // Дата и время комментария
    likesId: number[],
    dislikesId: number[]
}
export const nullComment:IComment={
  id:0,
  text: '',
  authorId : 0,
  date : new Date('0000-01-01T00:00:00.000').toJSON(),
  likesId : [],
  dislikesId: [],
}
export interface ICommentReport{
  id: number,
  reporterId: number,
  date: string,
  commentId: number
}
  
export interface ICommentReportForAdmin {
  recipeId:number,
  id: number;
  reporterId: number;
  date: string;
  commentId: number;
}