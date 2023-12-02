import { PermissionContext, role } from "../../models/users"

export interface NotificationSettingsSections {
  title: string;
  icon: string;
  role?: role[];

  items: NotificationSettingsSectionItems[];
}
export interface NotificationSettingsSectionItems {
    description: string,
  area: PermissionContext,
}

export const condifencialitySettings: NotificationSettingsSections[] = [
  {
    title: 'Анонимность',
    icon: 'anonim',
    items: [
      {
        description: 'Показывать вашу страницу на странице всех пользователей',
        area: 'show-me-on-userspage',
      },
      {
        description:
          'Показывать вашу страницу в результатах поиска на странице всех пользователей',
        area: 'search-me-on-userspage',
      },
      {
        description: 'Разрешить просматривать вашу страницу',
        area: 'show-my-page',
      },
      {
        description: 'Показать авторство ваших комментариев',
        area: 'comment-author',
      },
      {
        description: 'Показать авторство ваших рецептов',
        area: 'hide-author',
      },
    ],
  },
  {
    title: 'Ваша должность',
    role: ['admin', 'moderator'],
    icon: 'anonimous',
    items: [
      {
        description: 'Другие кулинары могут видеть вашу должность',
        area: 'show-status',
      },
    ],
  },
];

export const managersPreferences: NotificationSettingsSections[] = [
  {
    title: 'Общие настройки управляющих',
    icon: 'common',
    items: [
      {
        description: 'Показывать значок панели управления сайтом',
        area: 'show-adminpanel',
      },
      {
        description: 'Показывать кнопку удаления категории',
        area: 'show-category-deleting',
      },
      {
        description: 'Показывать кнопку удаления секции',
        area: 'show-section-deleting',
      },
      {
        description: 'Показывать кнопку удаления ингредиента',
        area: 'show-ingredient-deleting',
      },
      {
        description: 'Показывать кнопку удаления группы ингредиентов',
        area: 'show-ingredient-group-deleting',
      },
      {
        description:
          'Присылать уведомления, связанные с публикацией ваших обновлений',
        area: 'you-create-update',
      },
    ],
  },
  {
    title: 'Модераторы',
    role: ['moderator'],
    icon: 'star',
    items: [
      {
        description: 'Уведомлять вас о потере вашего статуса модератора',
        area: 'you-was-fired',
      },
      {
        description:
          'Присылать уведомления, связанные с рассмотрением ваших обновлений администратором',
        area: 'your-update-review',
      },
    ],
  },
  {
    title: 'Администратор',
    role: ['admin'],
    icon: 'star',
    items: [
      {
        description: 'Показывать кнопку назначения модератора',
        area: 'new-moder-button',
      },
      {
        description: 'Показывать кнопку удаления обновления',
        area: 'show-delete-update',
      },
    ],
  },
];

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
        description: 'Ваш рецепт рассмотрен',
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
    icon: 'grocery',
    title: 'Ингредиенты',
    items: [
      {
        description: 'Вы отправили ингредиент на проверку',
        area: 'you-create-ingredient',
      },
      {
        description: 'Ваш ингредиент рассмотрен',
        area: 'your-ingredient-published',
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
        description: 'Ваша категорию рассмотрена',
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
                 

export const stepsIcons: string[] = ['home','person','notifies','preferences','control','mask'] 
export const steps:string[] = ['Основное', 'Персональная информация','Уведомления','Предпочтения','Управление','Анонимность']