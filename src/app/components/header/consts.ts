export const cooksSelectItems: string[] = [
  'Кулинары',
  'Ваши подписки',
  'Все кулинары',
  'Обновления',
];

export const recipeRouterLinks: string[] = [
  '/recipes/yours',
  '/recipes',
  '/recipes/favorite',
  '/ingredients',
  '/match',
  '/sections',
];

export const recipeSelectItems: string[] = [
  'Рецепты',
  'Ваши рецепты',
  'Все рецепты',
  'Закладки',
  'Ингредиенты',
  'Подбор рецептов',
  'Разделы',
];

export const planSelectItems: string[] = [
  'Планнер',
  'Календарь рецептов',
  'Подборки',
  'Список покупок',
];

export const cookRouterLinks: string[] = [
  '/cooks/following/',
  '/cooks',
  '/cooks/updates',
];

export const planRouterLinks: string[] = [
  '/plan/calendar',
  '/plan/collections',
  '/plan/shopping-list',
];

export function userRoutes(id: number) {
  return [
    {
      routeLink: cookRouterLinks[0],
      disabled: !id,
    },
    {
      routeLink: cookRouterLinks[1],
      disabled: false,
    },
    {
      routeLink: cookRouterLinks[2],
      disabled: !id,
    },
  ];
}

export function planRoutes(id: number) {
  return [
    { routeLink: planRouterLinks[0], disabled: !id },

    {
      routeLink: planRouterLinks[1],
      disabled: false,
    },
    {
      routeLink: planRouterLinks[2],
      disabled: !id,
    },
  ];
}

export function recipeRoutes(id: number) {
  return [
    {
      routeLink: recipeRouterLinks[0],
      disabled: !id,
    },
    {
      routeLink: recipeRouterLinks[1],
      disabled: false,
    },
    {
      routeLink: recipeRouterLinks[2],
      disabled: !id,
    },
    {
      routeLink: recipeRouterLinks[3],
      disabled: false,
    },

    {
      routeLink: recipeRouterLinks[4],
      disabled: false,
    },
    {
      routeLink: recipeRouterLinks[5],
      disabled: false,
    },
  ];
}
