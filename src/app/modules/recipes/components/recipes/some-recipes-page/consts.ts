export enum RecipeType {
  Recent = 'recent',
  Popular = 'popular',
  My = 'my-recipes',
  Favorite = 'favorite',
  Category = 'category-recipes',
  All = 'all',
  Liked = 'liked',
  Cooked = 'cooked',
  Updates = 'updates',
  Discussed = 'discussed',
  Commented = 'commented'
}

export const recipeTitles = {
  [RecipeType.Recent]: 'Свежие рецепты',
  [RecipeType.Popular]: 'Популярные рецепты',
  [RecipeType.My]: 'Твои рецепты',
  [RecipeType.Favorite]: 'Закладки',
  [RecipeType.Category]: '',
  [RecipeType.All]: 'Все рецепты',
  [RecipeType.Liked]: 'Любимые рецепты',
  [RecipeType.Cooked]: 'Приготовленные рецепты',
  [RecipeType.Updates]: 'Обновления любимых кулинаров',
  [RecipeType.Discussed]: 'Самые обсуждаемые рецепты',
  [RecipeType.Commented]: 'Ты комментировал эти рецепты',
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
};

export const recipeNoRecipesText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]:
    'У тебя пока нет собственных рецептов. Попробуй создать парочку рецептов и зайди сюда снова',
  [RecipeType.Favorite]:
    'У тебя пока нет сохраненных рецептов. Попробуй добавить парочку рецептов в избранное и зайди сюда снова',
  [RecipeType.Category]:
    '',
  [RecipeType.All]: '',
  [RecipeType.Liked]:
    'У тебя пока нет любимых рецептов. Попробуй отметить парочку рецептов как понравившиеся и зайди сюда снова',
  [RecipeType.Cooked]:
    'У тебя пока нет сохраненных рецептов. Попробуй отметить парочку рецептов как приготовленные и зайди сюда снова',
  [RecipeType.Updates]:
    'Новых рецептов среди твоих подписок не найдено. Попробуй подписаться на более активных кулинаров и зайди сюда снова',
  [RecipeType.Discussed]:
    'Пока никто не прокомментировал рецепты. Попробуй сам прокомментировать парочку рецептов и зайди сюда снова',
  [RecipeType.Commented]:
    'Ты пока не прокомментировал ни один рецепт. Попробуй прокомментировать парочку рецептов и зайди сюда снова',
};
