import { IRecipe } from "./recipes";

  


  export interface IComment {
    id: number; // Уникальный идентификатор комментария
    text: string; // Текст комментария
    authorId: number; // Уникальный идентификатор автора комментария
    date: string; // Дата и время комментария
    liked: boolean;
    disliked: boolean;
    dislikesLength: number;
    likesLength: number;
    reported: boolean;
    recipeId?: number;
  }
export const nullComment:IComment={
  id: 0,
  reported:false,
  text: '',
  authorId : 0,
  date : new Date('0000-01-01T00:00:00.000').toJSON(),
  liked: false,
  dislikesLength: 0,
  likesLength:0,
  disliked:false
}
export interface ICommentReport{
  id: number,
  reporter: number,
  date: string,
  comment: number
}
  
export interface ICommentReportForAdmin {
  recipe:number,
  id: number;
  reporter: number;
  date: string;
  comment: number;
}