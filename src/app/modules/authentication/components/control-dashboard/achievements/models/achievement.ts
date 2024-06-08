export interface IAchievement {
  id: number;
  title: string;
  description: string;
  kind: string;
  points: number;
  iconUrl: string;
  progress?: number;
  color: string;
  date?: string;
  isScoreExceeded?: boolean;
  completionPercentage?: boolean;
  userCount?: number;
  isAchieved?: boolean;
  iconPath?: string;
  loading?: boolean;
}

export const loadingAchievement: IAchievement = {
  id: 0,
  title: 'Loading achievement',
  description: 'Achievement will be load soon... Await...',
  kind: '',
  points: 0,
  iconUrl: '',
  color:''
}

export const achievementDescriptions: { [key: string]: string } = {
  'all-recipes-likes': 'Количество лайков на всех рецептах пользователя',
  'all-your-comments-dislikes':
    'Количество дизлайков на всех комментариях пользователя',
  'you-comment': 'Количество комментариев, которые оставил пользователь',
  'all-your-comments-likes':
    'Количество лайков на всех комментариях пользователя',
  'all-your-comments':
    'Количество комментариев под всеми рецептами пользователя',
  'your-followers': 'Количество подписчиков пользователя',
  'you-follow': 'Количество подписок пользователя',

  'you-fav': 'Количество рецептов, которые пользователь добавил в избранное',
  'planned-recipes': 'Количество запланированных пользователем рецептов',
  products: 'Количество запланированных продуктов пользователя',
  ingredients: 'Количество публичных ингредиентов, которые создал пользователь',
  categories: 'Количество публичных категорий, которые создал пользователь',
  'public-recipes':
    'Количество публичных рецептов, которые создал пользователь',
  'private-recipes':
    'Количество приватных рецептов, которые создал пользователь',
   'all-your-planned':
     'Количество планов, составленных со всеми рецептами пользователя другими кулинарами',
   'all-your-favs': 'Количество добавлений в избранное всех рецептов пользователя',
   'you-like': 'Количество лайков, которые поставил пользователь на рецепты других кулинаров',
  'you-dislike-comments':
    'Количество дизлайков, которые поставил пользователь на комментарии',
  'you-like-comments': 
    'Количество лайков, которые поставил пользователь на комментарии других кулинаров',
};

