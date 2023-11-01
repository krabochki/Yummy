 export const cooksSelectItems: string[] = [
    'Кулинары',
    'Твой профиль',
    'Все кулинары',
    'Обновления',
  ];

 export const recipeRouterLinks: string[] = [
    '/recipes/yours',
    '/recipes',
    '/sections',
    '/recipes/favorite',
    '/match',
];
  
 export const recipeSelectItems: string[] = [
    'Рецепты',
    'Твои рецепты',
    'Все рецепты',
    'Разделы',
    'Закладки',
    'Подбор рецептов',
];

export const cookRouterLinks: string[] = ['/cooks/list/', '/cooks', '/cooks/updates'];



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
        disabled: false,
      },
      {
        routeLink: recipeRouterLinks[3],
        disabled: !id,
      },
      {
        routeLink: recipeRouterLinks[4],
        disabled: false,
      },
    ];
}

