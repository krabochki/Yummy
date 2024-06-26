 

export const steps: Step[] = [
  {
    title: 'Основная информация',
    shortTitle: 'Главное',
    description:
      'Напишите название категории, которую хотите увидеть на сайте, и загрузите для нее обложку.',
  },
  {
    title: 'Выбор раздела',
    shortTitle: 'Раздел',

    description:
      'Выберите раздел из раскрывающегося списка ниже. Если хотите, найдите раздел, начав печатать его название. Это достаточно важный шаг, так как он поможет найти категорию большему количеству заинтересованных кулинаров.',
  },
  {
    title: 'Заключение',
    shortTitle: 'Заключение',
    description:
      'Выбери, что вы хотите сделать с категорией: отправить модератору на одобрение или отменить ее добавление.',
  },
];
export interface Step {
  title: string;
  shortTitle: string;
  description: string;
}
