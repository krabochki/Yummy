const basePath = '/assets/images/plan/';

interface ICollection {
  name: string;
  description: string;
  sections: ICollectionPart[];
}
interface ICollectionPart {
  name: string;
  link: string;
  image: string;
  description: string;
}
const seasons: ICollection = {
  name: '4 сезона',
  description:
    'Путешествуйте по волшебным вкусам и ароматам с этой подборкой . Здесь вы найдете ингредиенты, соответствующие каждому времени года — от свежих летних фруктов до насыщенных осенних овощей. Эти продукты подарят вашим блюдам яркость и сезонное настроение, позволяя вам наслаждаться невероятными вкусовыми сочетаниями в течение всего года.',
  sections: [
    {
      name: 'Зимние рецепты',
      description:
        'Проведите зиму и праздники незабываемо вместе с нашей зимней подборкой. Наши рецепты подарят вам тепло и уют в холодные дни, помогая создать вкусные блюда для всей семьи.',
      image: basePath + 'winter.jpg',
      link: '/categories/list/39',
    },
    {
      name: 'Осенние гастрономические удовольствия',
      description:
        'Осень — это время сбора урожая и наслаждения разнообразными вкусами. Попробуйте наши осенние рецепты, чтобы создать впечатляющие блюда с сезонными ингредиентами.',
      image: basePath + 'autumn.jpg',
      link: '/categories/list/40',
    },
    {
      name: 'Летние кулинарные радости',
      description:
        'Лето — время свежих фруктов и овощей. Откройте для себя наши летние рецепты и приготовьте легкие и освежающие блюда для жарких дней.',
      image: basePath + 'summer.jpg',
      link: '/categories/list/38',
    },
    {
      name: 'Весенние вдохновляющие рецепты',
      description:
        'Весна приносит с собой новые начинания и свежие вкусы. Исследуйте наши весенние рецепты и создайте блюда с яркими и ароматными ингредиентами.',
      image: basePath + 'spring.jpg',
      link: '/categories/list/42',
    },
    {
      name: 'Зимний урожай',
      description:
        'Проведите зиму с нашей уютной зимней подборкой ингредиентов. От ароматных специй до сезонных ягод, эти продукты помогут вам создать блюда, наполненные теплом и уютом. Идеальные для праздников и семейных ужинов, рецепты с этими ингредиентами станут настоящим кулинарным праздником.',
      image: basePath + 'winter-harvest.jpg',
      link: '/groups/list/15',
    },
    {
      name: 'Осенний урожай',
      description:
        'Ощутите тепло и утешение в каждом укусе с нашей осенней подборкой. С яркими цветами и насыщенными вкусами, эти ингредиенты поднимут ваше настроение и наполнят кухню теплыми ароматами. Используйте их для создания умиротворяющих супов, запеченных овощей и сладких десертов, чтобы сделать холодные осенние дни еще более уютными.',
      image: basePath + 'autumn-harvest.jpg',
      link: '/groups/list/18',
    },
    {
      name: 'Летний урожай',
      description:
        'Погрузитесь в атмосферу свежести и сочности с нашей летней подборкой ингредиентов. От свежих фруктов до ароматных трав, эти продукты наполнят ваши блюда солнечным вкусом и легкостью. Наши рецепты помогут вам создать легкие, освежающие блюда, идеальные для горячих дней и вечеринок на открытом воздухе.',
      image: basePath + 'summer-harvest.jpg',
      link: '/groups/list/16',
    },
    {
      name: 'Весенний урожай',
      description:
        'Дайте весеннему свежести власть в вашей кухне с нашей весенней подборкой ингредиентов. От нежных зеленых листьев до ярких фруктов, эти продукты придают вашим блюдам легкость и аромат. Используйте их для приготовления свежих салатов, легких закусок и фруктовых десертов, чтобы привнести в кухню весеннюю радость и энергию.',
      image: basePath + 'spring-harvest.jpg',
      link: '/groups/list/18',
    },
  ],
};

const meals: ICollection = {
  name: 'От рассвета до заката',
  description:
    'От рассвета до заката, наша подборка предлагает ингредиенты и категории, идеальные для каждого времени суток. Начните день свежестью завтраков, переходите к сытным обедам, наслаждайтесь легкими перекусами в середине дня и завершите день изысканными ужинами. Эти продукты сделают ваше кулинарное путешествие полным и разнообразным, подчеркивая вкус каждого момента.',
  sections: [
    {
      name: 'Идеи для завтраков',
      description:
        'Начните свой день с вкусных и питательных завтраков. У нас есть рецепты для разнообразных завтраков, чтобы подарить вам энергию и хорошее настроение с самого утра.',
      link: '/categories/list/69',
      image: basePath + 'breakfast.jpg',
    },
    {
      name: 'Вдохновение для обедов',
      description:
        'Обед - отличное время для перерыва и наслаждения вкусными блюдами. Исследуйте наши рецепты обедов, чтобы приготовить себе сытный и вкусный обед за короткое время.',
      link: '/categories/list/77',
      image: basePath + 'lunch.jpg',
    },
    {
      name: 'Изысканные ужины',
      description:
        'Завершите свой день вкусным и удовлетворяющим ужином. У нас есть рецепты для разнообразных ужинов, чтобы создать атмосферу уютного вечера за столом.',
      link: '/categories/list/78',
      image: basePath + 'dinner.jpg',
    },
    {
      name: 'Креативные полдники и перекусы',
      description:
        'Время для легких перекусов и полдников. Исследуйте наши рецепты для быстрых и вкусных закусок, которые поднимут вам настроение в любое время дня.',
      image: basePath + 'snack.jpg',

      link: '/categories/list/79',
    },
    {
      name: 'Ингредиенты для вдохновляющих завтраков',
      description:
        'Начните свой день с вдохновляющих ингредиентов для завтраков. От свежих фруктов до изысканных злаков, эти продукты помогут создать бодрящие и сытные утренние блюда, придавая вашему началу дня особый вкус и энергию.',
      link: '/groups/list/11',
      image: basePath + 'breakfast-ingredients.jpg',
    },
    {
      name: 'Ингредиенты для сытных обедов',
      description:
        'В этой подборке вы найдете разнообразные ингредиенты, идеально подходящие для создания сытных и питательных обедов. От свежих овощей до белковых источников, эти продукты помогут вам приготовить вкусные и полезные блюда, поднимая энергию на вторую половину дня.',
      link: '/groups/list/12',
      image: basePath + 'lunch-ingredients.jpg',
    },
    {
      name: 'Потрясающие находки для ужинов',
      description:
        'Откройте для себя ингредиенты, которые превратят ваши ужины в настоящие кулинарные произведения. Сочные мяса, разнообразные овощи и запоминающиеся приправы создадут атмосферу уюта и удовольствия в каждом приеме пищи.',
      link: '/groups/list/13',
      image: basePath + 'dinner-ingredients.jpg',
    },
    {
      name: 'Ингредиенты для восхитительных перекусов',
      description:
        'Эта подборка предлагает легкие и вкусные ингредиенты для приготовления перекусов. От здоровых закусок до удовлетворяющих лакомств, эти продукты станут идеальным выбором для тех, кто стремится к уравновешенному и вкусному перекусу.',
      image: basePath + 'snack-ingredients.jpg',

      link: '/groups/list/14',
    },
  ],
};

export const collections: ICollection[] = [seasons, meals];
