const adminActions = [
  'рассмотрение записей об обновлениях;',
  'назначение и разжалование модераторов.',
];
const moderActions = [
  'рассмотрение и одобрение/отклонение предложенных рецептов, категорий и ингредиентов;',
  'рассмотрение жалоб на комментарии от пользователей;',
  'создание групп ингредиентов и разделов категорий;',
  'создание, редактирование и удаление рецептов, категорий и ингредиентов без ожидания модерации.',
];
export const actions = [
  {
    name: 'Администраторы',
    items: adminActions,
  },
  {
    name: 'Модераторы',
    items: moderActions,
  },
];