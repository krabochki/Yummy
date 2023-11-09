import { INotification } from "./notifications";

export interface IUser {
  id: number; // Уникальный идентификатор пользователя
  username: string; // Имя пользователя
  avatarUrl: FormData | null; // URL аватара пользователя
  description: string; // Описание пользователя
  quote: string; // Цитата пользователя
  email: string; // Почта пользователя
  password: string; //Пароль пользователя
  fullName: string; // Полное имя пользователя
  followersIds: number[]; // Список идентификаторов подписчиков
  socialNetworks: SocialNetwork[]; // Список социальных сетей пользователя
  personalWebsite: string; // Личный веб-сайт пользователя
  location: string; // Локация пользователя
  registrationDate: string; // Дата регистрации пользователя
  profileViews: number; // Количество просмотров профиля
  role: role;
  notifications: INotification[];
  permissions?: IPermission[];
  exclusions?: string[],
  permanent?: string[]
}

export interface IPermission {
  context: PermissionContext;
  enabled: boolean;
}

export type role = 'admin' | 'moderator' | 'user';

export type PermissionContext =
  | 'like-on-your-recipe'
  | 'cook-on-your-recipe'
  | 'plan-on-your-recipe'
  | 'fav-on-your-recipe'
  | 'you-create-new-recipe'
   |'you-delete-your-comment'
  | 'you-publish-recipe'
  |'you-edit-your-account'
  | 'manager-review-your-recipe'
  | 'you-delete-your-recipe'
  | 'you-edit-your-recipe'
  | 'new-follower'
  | 'new-recipe-from-following'
  | 'you-plan-recipe'
  | 'start-of-planned-recipe'
  | 'planned-recipes-in-3-days'
  | 'you-create-category'
       | 'your-recipe-commented'
      |            'your-reports-publish'
       |           'your-reports-reviewed-moderator'
        |         'your-commented-liked'
         |        'you-commented-recipe'
  | 'manager-reviewed-your-category';




export const nullUser: IUser = {
  id: 0,
  email: '',
  password: '',
  username: '',
  role: 'user',
  avatarUrl: null,
  description: '',
  quote: '',
  fullName: '',
  followersIds: [],
  socialNetworks: [],
  personalWebsite: '',
  location: '',
  registrationDate: '',
  profileViews: 0,
  notifications:[]
};

export interface SocialNetwork {
  name:
    | 'ВКонтакте'
    | 'twitter'
    | 'youtube'
    | 'instagram'
    | 'pinterest'
    | 'facebook'; // Название социальной сети
  link: string; // Ссылка на профиль пользователя в социальной сети
}
