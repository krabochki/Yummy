 export const steps: Step[] = [
   {
     title: 'Основная информация',
     shortTitle: 'Главное',
     description:
       'Расскажи немного о своем рецепте. Этот шаг — первый и самый важный, ведь именно по данным, которые ты оставишь тут, будут ориентироваться кулинары. Заполненные рецепты всегда самые просматриваемые!',
   },
   {
     title: 'Дополнительная информация',
     shortTitle: 'Прочее',

     description:
       'Пришло время рассказать чуть больше подробностей.. Время подготовки и готовки позволит кулинарам точно спланировать график готовки, благодаря количеству порций они смогут рассчитать соответствующие пропорции ингредиентов, а место происхождения поможет узнать больше о культуре того или иного региона.',
   },
   {
     title: 'Выбор категорий',
     shortTitle: 'Категории',

     description:
       'Выбери категории из раскрывающегося списка ниже. Если хочешь, найди категорию, начав печатать её название. Это достаточно важный шаг, так как он поможет найти твой рецепт большему количеству заинтересованных кулинаров и подскажет им похожие рецепты.',
   },
   {
     title: 'Ингредиенты',
     shortTitle: 'Ингредиенты',

     description:
       'Перечисли все ингредиенты, необходимые для приготовления твоего блюда. Укажи каждый ингредиент отдельно, с указанием количества и единиц измерения. Если ты укажешь количество игредиентов в числовом формате, кулинары смогут настраивать количество порций и ингредиентов для них под свои потребности!',
   },
   {
     title: 'Нутриенты',

     shortTitle: 'Нутриенты',
     description:
       'Перечисли информацию о пищевой ценности рецепта, такую как количество белков, жиров, углеводов, калорий и других питательных веществ. Эти данные важны для тех, кто следит за своей диетой или интересуется пищевой ценностью блюда.',
   },
   {
     title: 'Инструкции',
     shortTitle: 'Инструкции',
     description:
       'Перечисли шаги, которые нужно выполнить, чтобы приготовить блюдо. Этот раздел помогает структурировать процесс приготовления и обеспечивает ясность для кулинаров.',
   },
   {
     title: 'Заключение',
     shortTitle: 'Заключение',
     description: 'Выбери, что ты хочешь сделать с рецептом.',
   },
 ];
  export interface Step {
  title: string;
  shortTitle: string;
  description: string;
}