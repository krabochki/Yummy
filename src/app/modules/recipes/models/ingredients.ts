import { Nutrition } from "./recipes";

export interface IIngredient {
  id: number; 
  name: string; 
  history: string;
  description: string; 
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
  author?: number,
  sendDate?: string,
  nutritions?:Nutrition[],
  storageMethods?: string[],//способы хранения  
  externalLinks?: ExternalLink[]; //доп ресурсы
  shoppingListGroup?: number; //основное
  image: FormData | null;
}
export interface ExternalLink{
  name: string,
  link:string
}

export interface IIngredientsGroup {
  id: number;
  name: string;
  ingredients: number[];
  image:FormData|null
}

export const nullIngredient: IIngredient = {
  id: 0,
  name: '',
  description: '',
  history: '',
  status:'public',
  image: null,
  variations: [],
};
export const nullIngredientsGroup: IIngredientsGroup = {
  id: 0,
  image:null,
  name: '',
  ingredients: [],
};

