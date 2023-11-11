export enum RecipeType {
  Recent = 'recent',
  Popular = 'popular',
  My = 'my-recipes',
  Favorite = 'favorite',
  Category = 'category-recipes',
  All = 'all',
  Liked = 'liked',
  Cooked = 'cooked',
  Match = 'match',
  Updates = 'updates',
  Discussed = 'discussed',
  Commented = 'commented',
  Planning = 'planning',
  MostCooked = 'most-cooked',
  MostFavorite = 'most-favorite',
}

export const recipeTitles = {
  [RecipeType.Recent]: 'Свежие рецепты',
  [RecipeType.Popular]: 'Популярные рецепты',
  [RecipeType.My]: 'Ваши рецепты',
  [RecipeType.Favorite]: 'Закладки',
  [RecipeType.Category]: '',
  [RecipeType.All]: 'Все рецепты',
  [RecipeType.Liked]: 'Любимые рецепты',
  [RecipeType.Cooked]: 'Приготовленные рецепты',
  [RecipeType.Updates]: 'Обновления любимых кулинаров',
  [RecipeType.Discussed]: 'Самые обсуждаемые рецепты',
  [RecipeType.Commented]: 'Вы комментировали эти рецепты',
  [RecipeType.Planning]: 'Запланированные рецепты',
  [RecipeType.MostFavorite]: 'Наиболее сохраняемые рецепты',
  [RecipeType.MostCooked]: 'Готовят чаще всего',  
  [RecipeType.Match]:'Подобранные рецепты'
};

 export const recipeNoRecipesRouterLinkText = {
   [RecipeType.Recent]: '',
   [RecipeType.Popular]: '',
   [RecipeType.My]: '',
   [RecipeType.Favorite]: '/recipes',
   [RecipeType.Category]: '',
   [RecipeType.All]: '',
   [RecipeType.Liked]: '/recipes',
   [RecipeType.Cooked]: '/recipes',
   [RecipeType.Updates]: '/cooks',
   [RecipeType.Discussed]: '/recipes',
   [RecipeType.Commented]: '/recipes',
   [RecipeType.Planning]: '/plan/calendar',
   [RecipeType.MostCooked]: '',
   [RecipeType.MostFavorite]: '',
   [RecipeType.Match]:''
 };

export const recipeNoRecipesButtonText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]: 'Добавить рецепт',
  [RecipeType.Favorite]: 'Все рецепты',
  [RecipeType.Category]: 'Добавить рецепт',
  [RecipeType.All]: '',
  [RecipeType.Liked]: 'Все рецепты',
  [RecipeType.Cooked]: 'Все рецепты',
  [RecipeType.Updates]: 'Все кулинары',
  [RecipeType.Discussed]: 'Все рецепты',
  [RecipeType.Commented]: 'Все рецепты',
  [RecipeType.Planning]: 'Календарь рецептов',
  [RecipeType.MostCooked]: '',
  [RecipeType.MostFavorite]: '',
  [RecipeType.Match]:''
};

export const recipeNoRecipesText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]:
    'У вас пока нет собственных рецептов. Попробуйте создать парочку рецептов и зайдите сюда снова',
  [RecipeType.Favorite]:
    'У вас пока нет сохраненных рецептов. Попробуйте добавить парочку рецептов в избранное и зайдите сюда снова',
  [RecipeType.Category]: '',
  [RecipeType.All]: '',
  [RecipeType.Liked]:
    'У вас пока нет любимых рецептов. Попробуйте отметить парочку рецептов как понравившиеся и зайдите сюда снова',
  [RecipeType.Cooked]:
    'У вас пока нет сохраненных рецептов. Попробуйте отметить парочку рецептов как приготовленные и зайдите сюда снова',
  [RecipeType.Updates]:
    'Новых рецептов среди ваших подписок не найдено. Попробуйте подписаться на более активных кулинаров и зайдите сюда снова',
  [RecipeType.Discussed]:
    'Пока никто не прокомментировал рецепты. Попробуйте сами прокомментировать парочку рецептов и зайдите сюда снова',
  [RecipeType.Commented]:
    'Вы пока не прокомментировали ни один рецепт. Попробуйте прокомментировать парочку рецептов и зайдите сюда снова',
  [RecipeType.Planning]:
    'Вы пока не запланировали ни один рецепт. Попробуйте запланировать парочку рецептов и зайдите сюда снова',
  [RecipeType.MostCooked]: '',
  [RecipeType.MostFavorite]: '',
  [RecipeType.Match]:''
};
