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
  nutritionalInfo: NutritionInfo[]; // Пищевая ценность
  instructions: string[]; // Инструкции по приготовлению
  photos: string[]; // Фотографии (URL)
  categories: number[]; // Список айди категорий рецепта
  authorId: number; // Информация об авторе рецепта
  likesId: number[]; // Количество лайков
  cooksId: number[]; // Количество приготовлений
  comments: IComment[]; // Список комментариев
  publicationDate: string; // Дата регистрации пользователя
  favoritesId: number[]
}
export const nullRecipe:IRecipe ={ 
    id: 0 ,
  mainPhotoUrl: '' ,
  name: '' , 
  description:'', 
  preparationTime: '',
  servings: 0, 
  origin: '' ,
  ingredients: [],
  nutritionalInfo: [],
  instructions: [],
  photos:[],
  categories: [],
  authorId: 0,
  likesId: [],
  cooksId: [], 
  comments: [],
  favoritesId:[],
  publicationDate: '01-01-2000'
}
export interface Ingredient {
  name: string; // Название ингредиента
  quantity: number; // Количество
  unit: string; // Единица измерения
}

export interface NutritionInfo {
  name: string; // Название пищевой ценности
  quantity: number; // Количество
  unit: string; // Единица измерения
}
