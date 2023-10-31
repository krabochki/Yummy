export interface ICategory {
  id: number; // Уникальный идентификатор категории
  name: string; // Название категории
  photo: FormData | null;
  authorId: number;

  status: 'awaits' | 'public';
  sendDate: string;
}

  export interface ISection {
    id: number; // Уникальный идентификатор раздела
    name: string; // Название раздела
    categories: number[];
    photo: FormData | null;
    authorId:number,
    status: 'awaits' | 'public';
    sendDate: string;
  }
  

export const nullSection: ISection = {
  id: 0, // Уникальный идентификатор раздела
  name: '', // Название раздела
  categories: [],
  photo: null,
  status: 'public',
  authorId: 0,

  sendDate: '',
};
  
  export const nullCategory: ICategory = {
    id: 0, // Уникальный идентификатор раздела
    name: '', // Название раздела
    photo: null,
    authorId: 0,
    status: 'public',
    sendDate: '',
  };
  