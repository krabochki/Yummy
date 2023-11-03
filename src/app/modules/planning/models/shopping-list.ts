export interface ShoppingListItem {
  id: number;
  name: string; 
  howMuch: string;
  isBought: boolean; 
  relatedRecipe: number;
}

export const nullProduct: ShoppingListItem = {
  id: 0,
  name: '',
  howMuch: '',
  isBought: false,
  relatedRecipe: 0,
};
