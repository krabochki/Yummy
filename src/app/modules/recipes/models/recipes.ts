import { IComment } from 'src/app/modules/user-pages/models/comments';

export interface IRecipe {
  id: number; // Уникальный идентификатор рецепта
  mainPhotoUrl: string; // URL основного фото рецепта
  name: string; // Название рецепта
  description: string; // Описание рецепта
  preparationTime: string; // Время приготовления
  servings: number; // Количество порций
  origin: string; // Происхождение рецепта
  ingredients: Ingredient[]; // Список ингредиентов
  nutritions: Nutrition[]; // Пищевая ценность
  instructions: Instruction[]; // Инструкции по приготовлению
  categories: number[]; // Список айди категорий рецепта
  authorId: number; // Информация об авторе рецепта
  likesId: number[]; // Количество лайков
  cooksId: number[]; // Количество приготовлений
  history:string,
  comments: IComment[]; // Список комментариев
  publicationDate: string; // Дата регистрации пользователя
  favoritesId: number[]
}
export const nullRecipe: IRecipe = {
  id: 0,
  mainPhotoUrl: '',
  name: '',
  description: '',
  preparationTime: '',
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
};
export interface Ingredient {
  name: string; // Название ингредиента
  quantity: number; // Количество
  unit: string; // Единица измерения
}
export interface Instruction {
  content: string; // Название ингредиента
  photos: string[3]; // Единица измерения
}
export interface Nutrition {
  name: string; // Название пищевой ценности
  quantity: number; // Количество
  unit: string; // Единица измерения
}
