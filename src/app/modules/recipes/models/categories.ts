import { IUser } from "../../user-pages/models/users";

export interface ICategory {
  id: number; // Уникальный идентификатор категории
  name: string; // Название категории
  image?: string;
  sectionId?: number;
  authorId: number;
  recipeCount?: number;
  imageLoading?: boolean;
  imageURL?: string;
  section?: ISection;
  author?: IUser;
  status: 'awaits' | 'public';
  sendDate: string;
}

export interface ISection {
  imageLoading?: boolean;
    id: number; // Уникальный идентификатор раздела
    name: string; // Название раздела
    categoriesIds: number[];
    image?: string;
    imageURL?: string,
    //categories?:ICategory[],
    authorId:number,
    status: 'awaits' | 'public';
    sendDate: string;
  }
  

export const nullSection: ISection = {
  id: 0, // Уникальный идентификатор раздела
  name: '', // Название раздела
  categoriesIds: [],
  status: 'public',
  authorId: 0,

  sendDate: '',
};
  
  export const nullCategory: ICategory = {
    id: 0, // Уникальный идентификатор раздела
    name: '', // Название раздела
    authorId: 0,
    status: 'public',
    sendDate: '',
  };
  