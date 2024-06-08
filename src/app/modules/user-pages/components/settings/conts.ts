import { role } from "../../models/users"

export interface NotificationSettingsSections {
  title: string;
  icon: string;
  role?: role[];

  items: NotificationSettingsSectionItems[];
}
export interface NotificationSettingsSectionItems {
    description: string,
  area: Permission,
}

export enum Permission {
  AdminPanelButton = 'admin-panel-button',
  CategoryManagingButtons = 'category-buttons',
  SectionManagingButtons = 'sections-buttons',
  IngredientsManagingButtons = 'ingredients-buttons',
  NewsManagingButtons = 'news-buttons',
  GroupsManagingButtons = 'groups-buttons',
  OtherRecipesDeleteButton = 'recipes-delete-button',
  HiringButton = 'hiring-button',
  WorkNotifies = 'work-notifies',
  Firing = 'firing',
  NewsCreated = 'news-created',
  NewsEdited = 'news-edited',
  NewsSent = 'news-sent',
  NewsReviewed = 'news-reviewed',
  AchievementCreated = 'achievement-created',
  AchievementDeleted = 'achievement-deleted',
  NewsDeleted = 'news-deleted',
  YourRecipeLiked = 'your-recipe-liked',
  YourRecipeCooked = 'your-recipe-cooked',
  YourRecipeFaved = 'your-recipe-faved',
  YourRecipePlanned = 'your-recipe-planned',
  YourRecipeCommented = 'your-recipe-commented',
  RecipeCreated = 'recipe-created',
  RecipeEdited = 'recipe-edited',
  RecipeDeleted = 'recipe-deleted',
  RecipeSend = 'recipe-send',
  RecipeReviewed = 'recipe-reviewed',
  IngredientSend = 'ingredient-send',
  IngredientReviewed = 'ingredient-reviewed',
  CategorySend = 'category-send',
  CategoryReviewed = 'category-reviewed',
  FollowFromYou = 'followFromYou',
  AccountEdited = 'account-edited',
  FollowToYou = 'follow-to-you',
  RecipeFromFollowing = 'recipe-from-following',
  YouPlannedRecipe = 'you-planned-recipe',
  YouCommentRecipe = 'you-comment-recipe',
  NewAchievement = 'new-achievement',
  YourCommentDeleted = 'your-comment-deleted',
  YouReportedComment = 'you-reported-comment',
  YourCommentReported = 'your-comment-reported',
  YourCommentClassed = 'your-comment-classed',

  StartOfPlannedRecipeNotify = 'start-of-planned-recipes-notify',
  PlannedRecipesInThreeDays = 'planned-recipes-in-three-days',
}

export const managersPreferences: NotificationSettingsSections[] = [
  {
    title: 'Общие настройки управляющих',
    icon: 'common',
    items: [
      {
        description: 'Показывать значок панели управления сайтом',
        area: Permission.AdminPanelButton,
      },
      {
        description: 'Показывать кнопки управления категориями',
        area: Permission.CategoryManagingButtons,
      },
      {
        description: 'Показывать кнопку управления разделами',
        area: Permission.SectionManagingButtons,
      },

      {
        description: 'Показывать кнопки управления ингредиентами',
        area: Permission.IngredientsManagingButtons,
      },

      {
        description: 'Показывать кнопки управления группами ингредиентов',
        area: Permission.GroupsManagingButtons,
      },
      {
        description: 'Показывать кнопку удаления для не своих рецептов',
        area: Permission.OtherRecipesDeleteButton,
      },
      {
        description: 'Присылать уведомления при управлении сайтом',
        area: Permission.WorkNotifies,
      },
    ],
  },
  {
    title: 'Уведомления модераторам',
    role: ['moderator'],
    icon: 'star',
    items: [
      {
        description: 'Вы отправили новость на проверку',
        area: Permission.NewsSent,
      },
      {
        description: 'Ваша новость рассмотрена',
        area: Permission.NewsReviewed,
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
        area: Permission.HiringButton,
      },
      {
        description: 'Показывать кнопки управления новостями',
        area: Permission.NewsManagingButtons,
      },
      {
        description: 'Вы создали новую новость',
        area: Permission.NewsCreated,
      },
      {
        description: 'Вы изменили статус новости',
        area: Permission.NewsEdited,
      },
      {
        description: 'Вы удалили новость',
        area: Permission.NewsDeleted,
      },
      {
        description: 'Вы создали достижение',
        area: Permission.AchievementCreated,
      },
      {
        description: 'Вы удалили достижение',
        area: Permission.AchievementDeleted,
      },
    ],
  },
];

export const sections: NotificationSettingsSections[] = [
  {
    title: 'Рецепты',
    icon: 'lock-open',
    items: [
      {
        description: 'Кому-то понравился ваш рецепт',
        area: Permission.YourRecipeLiked,
      },
      {
        description: 'Кто-то приготовил ваш рецепт',
        area: Permission.YourRecipeCooked,
      },
      {
        description: 'Кто-то добавил ваш рецепт в закладки',
        area: Permission.YourRecipeFaved,
      },
      {
        description: 'Кто-то запланировал ваш рецепт в «Календаре рецептов»',
        area: Permission.YourRecipePlanned,
      },
    ],
  },

  {
    title: 'Ваши неопубликованные рецепты',
    icon: 'lock',

    items: [
      {
        description: 'Вы создали новый рецепт',
        area: Permission.RecipeCreated,
      },
      {
        description: 'Вы изменили  рецепт',
        area: Permission.RecipeEdited,
      },
      {
        description: 'Вы отправили рецепт на проверку',
        area: Permission.RecipeSend,
      },
      {
        description: 'Ваш рецепт рассмотрен',
        area: Permission.RecipeReviewed,
      },

      {
        description: 'Вы удалили свой рецепт',
        area: Permission.RecipeDeleted,
      },
    ],
  },
  {
    title: 'Аккаунт, подписчики, подписки',
    icon: 'diversity',
    items: [
      {
        description: 'Вы изменили свой аккаунт',
        area:Permission.AccountEdited,
      },
      {
        description: 'Вы подписались на кулинара',
        area: Permission.FollowFromYou,
      },
      {
        description: 'На вас кто-то подписался',
        area: Permission.FollowToYou,
      },
      {
        description:
          'Кулинар, на которого вы подписаны, опубликовал новый рецепт',
        area: Permission.RecipeFromFollowing,
      },
    ],
  },

  {
    title: 'Планирование',
    icon: 'plan',

    items: [
      {
        description: 'Вы запланировали новый рецепт',
        area: Permission.YouPlannedRecipe,
      },
      {
        description: 'Напоминания о начале запланированных рецептов',
        area: Permission.StartOfPlannedRecipeNotify,
      },
      {
        description:
          'Напоминания о запланированных рецептах в ближайшие три дня',
        area: Permission.PlannedRecipesInThreeDays,
      },
    ],
  },
  {
    icon: 'grocery',
    title: 'Ингредиенты',
    items: [
      {
        description: 'Вы отправили ингредиент на проверку',
        area: Permission.IngredientSend,
      },
      {
        description: 'Ваш ингредиент рассмотрен',
        area: Permission.IngredientReviewed,
      },
    ],
  },
  {
    icon: 'categories',
    title: 'Категории',
    items: [
      {
        description: 'Вы отправили категорию на проверку',
        area: Permission.CategorySend,
      },
      {
        description: 'Ваша категорию рассмотрена',
        area: Permission.CategoryReviewed,
      },
    ],
  },
  {
    icon: 'comments',
    title: 'Комментарии',
    items: [
      {
        description: 'Ваш рецепт прокомментировали',
        area: Permission.YourRecipeCommented,
      },
      {
        description: 'Вы оставили комментарий',
        area: Permission.YouCommentRecipe
      },

      {
        description: 'Вы удалили свой комментарий',
        area: Permission.YourCommentDeleted,
      },
      {
        description: 'Ваш комментарий оценили',
        area: Permission.YourCommentClassed,
      },

      {
        description: 'Вы пожаловались на чей-то комментарий',
        area: Permission.YouReportedComment,
      },

      {
        description: 'Кто-то пожаловался на ваш комментарий',
        area: Permission.YourCommentReported,
      },
    ],
  },
  {
    icon: 'achieve',
    title: 'Достижения',
    items: [
      {
        description: 'Вы получили новое достижение',
        area: Permission.NewAchievement
      }
    ]

    
  }
];

export type social = 'facebook'|'twitter'|'vk'|'email'|'telegram'|'viber'
                 

export const stepsIcons: string[] = [
  'home',
  'person',
  'notifies',
  'achieve',
  'control',
]; 
export const steps:string[] = ['Основное', 'Персональная информация','Уведомления', 'Достижения' ,'Управление']