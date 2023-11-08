import { PermissionContext } from "../../models/users"

export interface NotificationSettingsSections {
  title: string;
  icon: string;
  items: NotificationSettingsSectionItems[];
}
export interface NotificationSettingsSectionItems {
    description: string,
    area:PermissionContext
}

export const sections: NotificationSettingsSections[] = [
  {
    title: 'Ваши публикованные рецепты',
    icon: 'lock-open',
    items: [
      {
        description: 'Кому-то понравился ваш рецепт',
        area: 'like-on-your-recipe',
      },
      {
        description: 'Кто-то приготовил ваш рецепт и проголосовал в опросе',
        area: 'cook-on-your-recipe',
      },
      {
        description: 'Кто-то добавил ваш рецепт в закладки',
        area: 'fav-on-your-recipe',
      },
      {
        description: 'Кто-то запланировал ваш рецепт в «Календаре рецептов»',
        area: 'plan-on-your-recipe',
      },
    ],
  },

  {
    title: 'Ваши неопубликованные рецепты',
    icon: 'lock',

    items: [
      {
        description: 'Вы создали новый рецепт',
        area: 'you-create-new-recipe',
      },
      {
        description: 'Вы отправили рецепт на публикацию',
        area: 'you-publish-recipe',
      },
      {
        description: 'Модератор рассмотрел ваш рецепт',
        area: 'manager-review-your-recipe',
      },
      {
        description: 'Вы изменили свой рецепт',
        area: 'you-edit-your-recipe',
      },
      {
        description: 'Вы удалили свой рецепт',
        area: 'you-delete-your-recipe',
      },
    ],
  },
  {
    title: 'Аккаунт, подписчики, подписки',
    icon: 'diversity',
    items: [
      {
        description: 'Вы изменили свой аккаунт',
        area: 'you-edit-your-account',
      },
      {
        description: 'У вас появился новый подписчик',
        area: 'new-follower',
      },
      {
        description:
          'Кулинар, на которого вы подписаны, опубликовал новый рецепт',
        area: 'new-recipe-from-following',
      },
    ],
  },
  {
    title: 'Планирование',
    icon: 'plan',

    items: [
      {
        description: 'Вы запланировали новый рецепт',
        area: 'you-plan-recipe',
      },
      {
        description: 'Напоминание о начале запланированного вами рецепта',
        area: 'start-of-planned-recipe',
      },
      {
        description:
          'Напоминание о запланированных рецептах в ближайшие три дня',
        area: 'planned-recipes-in-3-days',
      },
    ],
  },
  {
    icon: 'categories',
    title: 'Категории',
    items: [
      {
        description: 'Вы отправили категорию на проверку',
        area: 'you-create-category',
      },
      {
        description: 'Вашу категорию рассмотрел модератор',
        area: 'manager-reviewed-your-category',
      },
    ],
  },
  {
    icon: 'comments',
    title: 'Комментарии',
    items: [
      {
        description: 'Ваш рецепт прокомментировали',
        area: 'your-recipe-commented',
      },
      {
        description: 'Вы оставили комментарий ',
        area: 'you-commented-recipe',
      },

      {
        description: 'Вы удалили свой комментарий',
        area: 'you-delete-your-comment',
      },
      {
        description: 'Ваш комментарий оценили',
        area: 'your-commented-liked',
      },

      {
        description: 'Ваши жалобы на чужие комментарии',
        area: 'your-reports-publish',
      },

      {
        description: 'Жалобы на ваши комментарии',
        area: 'your-reports-reviewed-moderator',
      },
    ],
  },
];

export type social = 'facebook'|'twitter'|'vk'|'pinterest'
                 
                
export const steps:string[] = ['Основное', 'Персональная информация','Уведомления']