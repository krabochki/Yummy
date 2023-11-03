import { ShoppingListItem } from './shopping-list';

export interface IPlan {
  id: number;
  user: number;
  shoppingList: ShoppingListItem[];
  plans: RecipePlan[];
}

export interface RecipePlan {
  id: number;
  recipe: number;
  dueDate: string;
}

export const nullPlan: IPlan = {
  id: 0,
  user: 0,
  shoppingList: [],
  plans: [],
};
