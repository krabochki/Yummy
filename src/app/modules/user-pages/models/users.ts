export interface IUser {
    id: number; // Уникальный идентификатор пользователя
    username: string; // Имя пользователя
    avatarUrl: string; // URL аватара пользователя
    description?: string; // Описание пользователя
    quote?: string; // Цитата пользователя
    email?: string; // Почта пользователя
    fullName?: string; // Полное имя пользователя
    followersIds?: number[]; // Список идентификаторов подписчиков
    socialNetworks?: SocialNetwork[]; // Список социальных сетей пользователя
    personalWebsite?: string; // Личный веб-сайт пользователя
    location?: string; // Локация пользователя
    registrationDate?: string; // Дата регистрации пользователя
    profileViews?: number; // Количество просмотров профиля
  }
  
  export interface SocialNetwork {
    name: string; // Название социальной сети
    link: string; // Ссылка на профиль пользователя в социальной сети
  }