export enum UsersType {
  Popular = 'popular',
  MostViewed = 'most-viewed',
  Managers = 'managers',
  Followers = 'followers',
  Following = 'following',
  Productive = 'productive',
  Nearby = 'nearby',
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
  [UsersType.Nearby]:'Кулинары рядом'
};



export const noUsersText = {
  [UsersType.MostViewed]: '',
  [UsersType.Popular]: '',
  [UsersType.Nearby]: 'Пока еще нет ни одного кулинара с похожей указанной локацией',
  [UsersType.Managers]: '',
  [UsersType.Followers]:
    'У тебя пока нет подписчиков. Попробуй повысить популярность, создав пару рецептов и проявляя активность, и зайди сюда снова!',
  [UsersType.Following]:
    'У тебя пока нет подписчиков. Попробуй подписаться на парочку кулинаров и зайди сюда снова',
  [UsersType.Productive]: '',
  [UsersType.All]: '',
};
