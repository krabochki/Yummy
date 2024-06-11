import { IComment, ICommentReport } from 'src/app/modules/recipes/models/comments';

export interface IRecipe {
  id: number; // Уникальный идентификатор рецепта
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainImage?: string; // URL основного фото рецепта
  imageLoading?: boolean;
  commentsLength?: number;
  imageURL?: string;
  avatarURL?: string;
  avatar?: string;
  authorName?: string;
  name: string; // Название рецепта
  description: string; // Описание рецепта
  preparationTime: string; // Время приготовления
  cookingTime: string;
  loadAuthor?: string;
  servings: number; // Количество порций
  origin: string; // Происхождение рецепта
  ingredients: Ingredient[]; // Список ингредиентов
  nutritions: Nutrition[]; // Пищевая ценность
  instructions: Instruction[]; // Инструкции по приготовлению
  categories: number[]; // Список айди категорий рецепта
  authorId: number; // Информация об авторе рецепта
  likesLength: number;
  liked: boolean;
  cooksLength: number;
  cooked: boolean;
  faved: boolean;
  history: string;
  comments: IComment[]; // Список комментариев
  publicationDate: string; // Дата регистрации пользователя
  status: 'awaits' | 'private' | 'public';
  reports: ICommentReport[];
  statistics?: IRecipeStatistics;
}

export interface RecipeGroup{
  name: string,
  shortName?: string;
  recipes: number[],
  link: string,
  auth: boolean
}

    

export interface IRecipeStatistics{
  negative: number;
  positive: number;
  userVote: boolean | null;
} 
export const nullRecipe: IRecipe = {
  id: 0,
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
  likesLength: 0,
  cooksLength: 0,
  cooked: false,
  liked: false,
  faved:false,
  comments: [],
  publicationDate: '01-01-2000',
  status: 'private',
};
export interface Ingredient {
  name: string; // Название ингредиента
  quantity: string; // Количество
  have: boolean;
  basket: boolean;
  unit: string; // Единица измерения
}
export interface Instruction {
  name: string; // Название ингредиента
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images: any; // Единица измерения
  id: number;
}
export interface Nutrition {
  name: string; // Название пищевой ценности
  quantity: string; // Количество
  unit: string; // Единица измерения
}
