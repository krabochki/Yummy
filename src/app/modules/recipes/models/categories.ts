export interface ICategory {
    id: number; // Уникальный идентификатор категории
    name: string; // Название категории
  }

  export interface ISection {
    id: number; // Уникальный идентификатор раздела
    name: string; // Название раздела
    categoriesId: number[];
  }
  