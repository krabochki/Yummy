import { IComment, ICommentReport } from 'src/app/modules/recipes/models/comments';

export interface IRecipe {
  id: number; // Уникальный идентификатор рецепта
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainImage: FormData | null; // URL основного фото рецепта
  name: string; // Название рецепта
  description: string; // Описание рецепта
  preparationTime: string; // Время приготовления
  cookingTime: string;
  servings: number; // Количество порций
  origin: string; // Происхождение рецепта
  ingredients: Ingredient[]; // Список ингредиентов
  nutritions: Nutrition[]; // Пищевая ценность
  instructions: Instruction[]; // Инструкции по приготовлению
  categories: number[]; // Список айди категорий рецепта
  authorId: number; // Информация об авторе рецепта
  likesId: number[]; // Количество лайков
  cooksId: number[]; // Количество приготовлений
  history: string;
  comments: IComment[]; // Список комментариев
  publicationDate: string; // Дата регистрации пользователя
  favoritesId: number[];
  status: 'awaits' | 'private' | 'public',
  reports: ICommentReport[]
}
export const nullRecipe: IRecipe = {
  id: 0,
  mainImage: null,
  name: '',
  description: '',
  cookingTime: '',
  preparationTime: '',
  reports:[],
  servings: 0,
  origin: '',
  ingredients: [],
  nutritions: [],
  instructions: [],
  categories: [],
  history: '',
  authorId: 0,
  likesId: [],
  cooksId: [],
  comments: [],
  favoritesId: [],
  publicationDate: '01-01-2000',
  status: 'private',
};
export interface Ingredient {
  name: string; // Название ингредиента
  quantity: string; // Количество
  unit: string; // Единица измерения
}
export interface Instruction {
  name: string; // Название ингредиента
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images: FormData[]; // Единица измерения
}
export interface Nutrition {
  name: string; // Название пищевой ценности
  quantity: string; // Количество
  unit: string; // Единица измерения
}
