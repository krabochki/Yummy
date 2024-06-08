export interface IReport {
  recipeId?: number;
  sendDate?: string;
  commentId: number;
  id?: number;
  reportAuthorName: string;
  commentAuthorName: string;
  recipeName: string;
    commentText: string;
    
    commentAuthorId: number;
  reporterId: number;
}