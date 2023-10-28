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
};

 export const recipeNoRecipesRouterLinkText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]: '',
  [RecipeType.Favorite]: '/recipes',
  [RecipeType.Category]: '/sections',
  [RecipeType.All]: '',
  [RecipeType.Liked]: '/recipes',
  [RecipeType.Cooked]: '/recipes',
  [RecipeType.Updates]: '/cooks',
};

export const recipeNoRecipesButtonText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]: 'Добавить рецепт',
  [RecipeType.Favorite]: 'Все рецепты',
  [RecipeType.Category]: 'Все категории',
  [RecipeType.All]: '',
  [RecipeType.Liked]: 'Все рецепты',
  [RecipeType.Cooked]: 'Все рецепты',
  [RecipeType.Updates]: 'Все кулинары',
};

export const recipeNoRecipesText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]:
    'У вас пока нет собственных рецептов. Попробуйте создать парочку рецептов и зайдите сюда снова',
  [RecipeType.Favorite]:
    'У вас пока нет сохраненных рецептов. Попробуйте добавить парочку рецептов в избранное и зайдите сюда снова',
  [RecipeType.Category]:
    'В этой категории пока нет рецептов. Следите за обновлениями, совсем скоро они появятся!',
  [RecipeType.All]: '',
  [RecipeType.Liked]:
    'У вас пока нет любимых рецептов. Попробуйте отметить парочку рецептов как понравившиеся и зайдите сюда снова',
  [RecipeType.Cooked]:
    'У вас пока нет сохраненных рецептов. Попробуйте отметить парочку рецептов как приготовленные и зайдите сюда снова',
  [RecipeType.Updates]:
    'Новых рецептов среди ваших кулинаров не найдено. Попробуйте подписаться на более активных кулинаров и зайдите сюда снова',
};
