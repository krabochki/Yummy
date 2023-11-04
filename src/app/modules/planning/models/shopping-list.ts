export interface ShoppingListItem {
  id: number;
  name: string;
  howMuch: string;
  isBought: boolean;
  relatedRecipe: number;
  type: ProductType;
}

type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ProductType = {
  without: 'without',
  dairy: 'dairy',
  bakery: 'bakery',
  fruits: 'fruits',
  vegetables: 'vegetables',
  meat: 'meat',
  seafood: 'seafood',
  beverages: 'beverages',
  canned_foods: 'canned foods',
  condiments: 'condiments',
  snacks: 'snacks',
  grains: 'grains',
  sweets: 'sweets',
  spices: 'spices',
  frozen_foods: 'frozen foods',
  healthy_options: 'healthy options',
  baking_supplies: 'baking supplies',
  non_alcoholic_drinks: 'non-alcoholic drinks',
  alcoholic_beverages: 'alcoholic beverages',
  breakfast: 'breakfast',
  deli: 'deli',
  baby_food: 'baby food',
  pet_supplies: 'pet supplies',
  household: 'household',
  personal_care: 'personal care',
};


export const nullProduct: ShoppingListItem = {
  id: 0,
  name: '',
  howMuch: '',
  isBought: false,
  relatedRecipe: 0,
  type: ProductType.without,
};


