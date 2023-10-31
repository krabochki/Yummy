export const steps: Step[] = [
   {
     title: 'Основная информация',
     shortTitle: 'Главное',
     description:
       'Расскажи немного о себе и загрузи обложку для профиля. Будет лучше, если это будет твоя фотография. Этот шаг — первый и самый важный, ведь именно по данным, которые ты оставишь тут, будут ориентироваться кулинары. Заполненные профили всегда самые просматриваемые!',
   },
   {
     title: 'Дополнительная информация',
     shortTitle: 'Прочее',

     description:
       'Пришло время рассказать чуть больше подробностей... Личная цитата, описание и место проживания помогут кулинарам узнать больше о твоем жизненном пути и истории. Если у тебя есть личный сайт, можешь оставить на него ссылку.',
   },
   
  {
    title: 'Социальные сети',
    shortTitle: 'Социальные сети',

    description:
      'Ссылки на социальные сети позволят заинтересованным кулинарам подписаться на тебя и следить за твоими обновлениями не только в Yummy.',
  },
  {
    title: 'Заключение',
    shortTitle: 'Заключение',
    description:
      'Выбери, что ты хочешь сделать с аккаунтом: сохранить изменения или отменить их применение.',
  },
];
export interface Step {
  title: string;
  shortTitle: string;
  description: string;
}