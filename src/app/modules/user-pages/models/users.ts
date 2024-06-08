/* eslint-disable @typescript-eslint/no-explicit-any */
import { INotification } from "./notifications";
import { RecipeCalendarEvent } from "../../planning/models/calendar";
import { ShoppingListItem } from "../../planning/models/shopping-list";

export interface IUser {
  loading?: boolean;
  online?: boolean;
  birthday: string;
  loadingImage?: boolean;
  appointmentDate?: any;

  recipesCount?: number;
  followersCount?: number;
  followingsCount?: number;
  isFollower?: number;
  id: number; // Уникальный идентификатор пользователя
  image?: string;
  calendarEvents: RecipeCalendarEvent[];
  shoppingList: ShoppingListItem[];
  username: string; // Имя пользователя
  avatarUrl?: string; // URL аватара пользователя
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
  exclusions?: string[];
  limitations?: string[];
  permanent?: string[];
  emoji?: any;
}



export type role = 'admin' | 'moderator' | 'user';



export const nullUser: IUser = {
  id: 0,
  email: '',
  birthday: '',

  password: '',
  username: '',
  calendarEvents: [],
  shoppingList: [],
  role: 'user',
  description: '',
  quote: '',
  fullName: '',
  followersIds: [],
  socialNetworks: [],
  personalWebsite: '',
  location: '',
  registrationDate: '',
  profileViews: 0,
  notifications: [],
};

export interface SocialNetwork {
  name:
  | 'ВКонтакте'
  | 'twitter'
  | 'telegram'
  |'email'
    | 'pinterest'
    | 'facebook'; // Название социальной сети
  link: string; // Ссылка на профиль пользователя в социальной сети
}
