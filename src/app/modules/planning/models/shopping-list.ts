export interface ShoppingListItem {
  id: number;
  name: string;
  howMuch: string;
  isBought: boolean;
  relatedRecipe: number;
  type: number;
  note: string;
}


export interface ProductType {
  id: number, 
  color:string,
  name: string,
  image?:string,
}
export const productTypes: ProductType[] = [
  {
    id: 0,
    name: 'Без категории',
    image:'empty',
    color: '#808080',
  },
  {
    id: 1,
    name: 'Молочные продукты',
    color: '#FF33E8', // Ярко-розовый
    image: 'dairy',
  },
  {
    id: 2,
    name: 'Хлебобулочные изделия',
    color: '#33FF57', // Ярко-зеленый
    image: 'bread',
  },
  {
    id: 3,
    name: 'Фрукты',
    color: '#5733FF', // Ярко-синий
    image: 'fruits',
  },
  {
    id: 4,
    name: 'Овощи',
    image: 'vegetables',

    color: '#FF5733', // Ярко-коралловый
  },
  {
    id: 5,
    name: 'Мясо',
    color: '#FF3366', // Ярко-красный
    image: 'meat',
  },
  {
    id: 6,
    name: 'Морепродукты',
    color: '#33FFFF', // Ярко-голубой
    image: 'seafood',
  },
  {
    id: 7,
    name: 'Напитки',
    color: '#FF9900', // Ярко-оранжево-желтый
    image: 'drinks',
  },
  {
    id: 8,
    name: 'Консервы',
    color: '#FF4D4D', // Ярко-красный
    image: 'preserves',
  },
  {
    id: 9,
    name: 'Приправы',
    image: 'seasonings',

    color: '#A64AC9', // Ярко-фиолетовый
  },
  {
    id: 10,
    image: 'snacks',
    name: 'Закуски',
    color: '#00CC99', // Ярко-зеленый
  },
  {
    id: 11,
    name: 'Зерновые продукты',
    image: 'grainings',

    color: '#CCCC00', // Ярко-желтый
  },
  {
    id: 12,
    image: 'sweets',

    name: 'Сладости',
    color: '#FF6666', // Ярко-розовый
  },
  {
    id: 13,

    name: 'Специи',
    image: 'species',
    color: '#3399FF', // Ярко-синий
  },
  {
    id: 14,
    image: 'cold',

    name: 'Замороженные продукты',
    color: '#66CC66', // Ярко-зеленый
  },
  {
    id: 15,
    name: 'Здоровое питание',
    image: 'healthy-food',
    color: '#FFCC00', // Ярко-желтый
  },
  {
    id: 16,
    image: 'baking',

    name: 'Пекарские ингредиенты',
    color: '#be00ff', // Ярко-коралловый
  },
  {
    id: 17,
    image: 'non-alcoholic-beer',

    name: 'Безалкогольные напитки',
    color: '#FF5733', // Ярко-коралловый
  },
  {
    id: 18,
    image: 'alckocolic-drinks',

    name: 'Алкогольные напитки',
    color: '#ff294d', // Ярко-коралловый
  },
  {
    image: 'semifood',
    id: 19,

    name: 'Полуфабрикаты',
    color: '#00ffab', // Ярко-коралловый
  },
  {
    id: 20,
    name: 'Деликатесы',
    image: 'expensive-foot',

    color: '#f7f21a', // Ярко-коралловый
  },
  {
    id: 21,
    image: 'babies',

    name: 'Детское питание',
    color: '#00b7ff', // Ярко-коралловый
  },
  {
    id: 22,
    image: 'fastfood',

    name: 'Фастфуд',
    color: '#50b4ff', // Ярко-коралловый
  },
  {
    id: 23,
    image: 'berries',

    name: 'Ягоды',
    color: '#ff468d', // Ярко-коралловый
  },
  {
    id: 24,
    image: 'mushrooms',

    name: 'Грибы',
    color: '#8d00ff', // Ярко-коралловый
  },
  {
    id: 25,
    image: 'petfood',

    name: 'Для питомцев',
    color: '#ff0004', // Ярко-коралловый
  },
];




export const nullProduct: ShoppingListItem = {
  id: 0,
  name: '',
  note:'',
  howMuch: '',
  isBought: false,
  relatedRecipe: 0,
  type: 0,
};


