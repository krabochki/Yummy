export interface ICategory {
    id: number; // Уникальный идентификатор категории
  name: string; // Название категории
  photo: string;
  
  }

  export interface ISection {
    id: number; // Уникальный идентификатор раздела
    name: string; // Название раздела
    categoriesId: number[];
    photo: string;
  }
  

  export interface ICategory {
    id: number; // Уникальный идентификатор категории
    name: string; // Название категории
    photo: string;
  }

export const nullSection: ISection = {
  id : 0, // Уникальный идентификатор раздела
  name : '', // Название раздела
  categoriesId : [],
  photo : ''
  }
  
  export const nullCategory: ICategory = {
  id : 0, // Уникальный идентификатор раздела
  name : '', // Название раздела
  photo : ''
  }
  