export enum UsersType {
  Popular = 'popular',
  MostViewed = 'most-viewed',
  Managers = 'managers',
  Following = 'following',
  Productive = 'productive',
  Nearby = 'nearby',
  All = 'all',
  New = 'new'
}

export interface UserGroup {
  name: string;
  users: number[];
  link: string;
  auth: boolean;
}


export const userTitles = {
  [UsersType.MostViewed]: 'Самые просматриваемые кулинары',
  [UsersType.Popular]: 'Популярные кулинары',
  [UsersType.Managers]: 'Управляющие',
  [UsersType.Following]: 'Ваши подписки',
  [UsersType.Productive]: 'Самые продуктивные кулинары',
  [UsersType.All]: 'Все кулинары',
  [UsersType.Nearby]: 'Кулинары рядом',
  [UsersType.New]:'Новые авторы'
};



export const noUsersText = {
  [UsersType.MostViewed]: '',
  [UsersType.Popular]: '',
  [UsersType.Nearby]: 'Пока еще нет ни одного кулинара с похожей указанной локацией!',
  [UsersType.Managers]: '',
  [UsersType.Following]:
    'У вас пока нет подписчиков. Попробуйте подписаться на парочку кулинаров и зайдите сюда снова!',
  [UsersType.Productive]: '',
  [UsersType.All]: '',
  [UsersType.New]:''
};


export const searchTypes = {
  [UsersType.MostViewed]: 'most-viewed-users',
  [UsersType.Popular]: 'popular-users',
  [UsersType.Nearby]: 'nearby-users',
  [UsersType.Managers]: 'managers-users',
  [UsersType.Following]: 'following-users',
  [UsersType.Productive]: 'productive-users',
  [UsersType.All]: 'all-users',
  [UsersType.New]: 'new-users',
};
