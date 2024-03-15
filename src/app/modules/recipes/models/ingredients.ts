import { Nutrition } from './recipes';

export interface IIngredient {
  id: number;
  name: string;
  history: string;
  description: string;
  imageLoading?: boolean;
  approvedName?: string;
  creatorName?: string;
  changerName?: string;
  recipesCount?: number;
  modifiedDate?: string;

  changerId?: number;
  approvedDate?: string;

  approvedId?: number;

  variations: string[]; //варианты написания ингредиента
  //которые будут учитываться при поиске рецептов с ним.например картофель: картошка, бульба и тд
  advantages?: string[];
  disadvantages?: string[];
  recommendedTo?: string[];
  contraindicatedTo?: string[]; //противопоказано
  status: 'awaits' | 'public';
  origin?: string;
  precautions?: string[]; //меры предосторожности
  compatibleDishes?: string[]; // с чем сочетается
  cookingMethods?: string[]; //как готовить
  tips?: string[];
  author?: number;
  sendDate?: string;
  nutritions?: Nutrition[];
  storageMethods?: string[]; //способы хранения
  externalLinks?: ExternalLink[]; //доп ресурсы
  shoppingListGroup?: number; //основное
  image?: string;
  imageURL?: string;
}
export interface ExternalLink {
  name: string;
  link: string;
}

export interface IGroup {
  id: number;
  name: string;
  imageLoading?: boolean;
  ingredients: number[];
  imageURL?: string;
  image?: string;
}

export const nullIngredient: IIngredient = {
  id: 0,
  name: '',
  description: '',
  history: '',
  status: 'public',
  variations: [],
};
export const nullGroup: IGroup = {
  id: 0,
  name: '',
  ingredients: [],
};
