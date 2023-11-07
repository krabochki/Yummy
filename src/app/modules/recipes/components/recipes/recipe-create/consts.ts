 export const steps: Step[] = [
   {
     title: 'Основная информация',
     shortTitle: 'Главное',
     description:
       'Расскажите немного о своем рецепте. Этот шаг — первый и самый важный, ведь именно по данным, которые вы оставите тут, будут ориентироваться кулинары. Заполненные рецепты всегда самые просматриваемые!',
   },
   {
     title: 'Дополнительная информация',
     shortTitle: 'Прочее',

     description:
       'Пришло время рассказать чуть больше подробностей... Время подготовки и готовки позволит кулинарам точно спланировать график готовки, благодаря количеству порций они смогут рассчитать соответствующие пропорции ингредиентов, а место происхождения поможет узнать больше о культуре того или иного региона.',
   },
   {
     title: 'Выбор категорий',
     shortTitle: 'Категории',

     description:
       'Выберите категории из раскрывающегося списка ниже. Если хотите, найдите категорию, начав печатать её название. Это достаточно важный шаг, так как он поможет найти ваш рецепт большему количеству заинтересованных кулинаров и подскажет им похожие рецепты.',
   },
   {
     title: 'Ингредиенты',
     shortTitle: 'Ингредиенты',

     description:
       'Перечислите все ингредиенты, необходимые для приготовления вашего блюда. Укажите каждый ингредиент отдельно, с указанием количества и единиц измерения. Если вы укажете количество игредиентов в числовом формате, кулинары смогут настраивать количество порций и ингредиентов для них под свои потребности!',
   },
   {
     title: 'Нутриенты',

     shortTitle: 'Нутриенты',
     description:
       'Перечислите информацию о пищевой ценности рецепта, такую как количество белков, жиров, углеводов, калорий и других питательных веществ. Эти данные важны для тех, кто следит за своей диетой или интересуется пищевой ценностью блюда.',
   },
   {
     title: 'Инструкции',
     shortTitle: 'Инструкции',
     description:
       'Перечислите шаги, которые нужно выполнить, чтобы приготовить блюдо. Этот раздел помогает структурировать процесс приготовления и обеспечивает ясность для кулинаров.',
   },
   {
     title: 'Заключение',
     shortTitle: 'Заключение',
     description: 'Выберите, что вы хотите сделать с рецептом.',
   },
 ];
  export interface Step {
  title: string;
  shortTitle: string;
  description: string;
}