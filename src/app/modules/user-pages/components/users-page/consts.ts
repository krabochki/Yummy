export enum UsersType {
  Popular = 'popular',
  MostViewed = 'most-viewed',
  Managers = 'managers',
  Followers = 'followers',
  Following = 'following',
  Productive = 'productive',
  All = 'all',
}

export const userTitles = {
  [UsersType.MostViewed]: 'Самые просматриваемые кулинары',
  [UsersType.Popular]: 'Популярные кулинары',
  [UsersType.Managers]: 'Управляющие',
  [UsersType.Followers]: 'Ваши подписчики',
  [UsersType.Following]: 'Ваши подписки',
  [UsersType.Productive]: 'Самые продуктивные кулинары',
  [UsersType.All]: 'Все кулинары',
};



export const noUsersText = {
  [UsersType.MostViewed]: '',
  [UsersType.Popular]: '',
  [UsersType.Managers]: '',
  [UsersType.Followers]:
    'У вас пока нет подписчиков. Попробуйте повысить популярность, создав пару рецептов и проявляя активность, и зайдите сюда снова!',
  [UsersType.Following]:
    'У вас пока нет подписчиков. Попробуйте подписаться на парочку кулинаров и зайдите сюда снова',
  [UsersType.Productive]: '',
  [UsersType.All]: '',
};
