  


  export interface IComment {
    id: number; // Уникальный идентификатор комментария
    text: string; // Текст комментария
    authorId: number; // Уникальный идентификатор автора комментария
    date: Date; // Дата и время комментария
    likesId: number[],
    dislikesId: number[]
  }