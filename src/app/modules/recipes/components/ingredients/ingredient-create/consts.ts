export const steps: Step[] = [
  {
    title: 'Основная информация',
    shortTitle: 'Главное',
    description:
      'Расскажите немного о будущем ингредиенте. Введите имя будущего ингредиента, расскажите, где и как его открыли, опишите его.',
  },
  {
    title: 'Обзор',
    shortTitle: 'Обзор',

    description:
      'Пришло время рассказать чуть больше подробностей... Расскажите о преимуществах и недостатках использования ингредиента, кому он рекомендован, а кому, в связи с медицинскими показаниями, противопоказан.',
  },
  {
    title: 'Готовка',
    shortTitle: 'Готовка',

    description:
      'Расскажите, какие способы приготовления ингредиента существуют, какие меры предосторожности надо соблюдать, и с чем ингредиент сочетается.',
  },
  {
    title: 'Советы',
    shortTitle: 'Советы',

    description:
      'Поделитесь советами, связанными с готовкой, употреблением ингредиента из личного опыта или общих источников, а также расскажите, как, где и почему нужно хранить ингредиент.',
  },
  {
    title: 'Нутриенты',
    shortTitle: 'Нутриенты',

    description:
      'Перечислите приблизительные характеристики нутриентов ингредиента.',
  },
  {
    title: 'Дополнительные источники',
    shortTitle: 'Ссылки',
    description:
      'Поделитесь ссылками на альтернативные источники для более подробного изучения ингредиента.',
  },

  {
    title: 'Заключение',
    shortTitle: 'Заключение',
    description: 'Выберите, что вы хотите сделать с ингредиентом.',
  },
];
export interface Step {
  title: string;
  shortTitle: string;
  description: string;
}

export function getInputPlaceholderOfControlGroup(controlGroup: string): string {
    switch (controlGroup) {
      case 'advantages':
        return 'Содержание преимущества';
      case 'disadvantages':
        return 'Содержание недостатка';
      case 'recommendations':
        return 'Содержание рекоммендации';
      case 'contraindicates':
        return 'Содержание противопоказания';
      case 'cookingMethods':
        return 'Описание способа приготовления';
      case 'compatibleDishes':
        return 'Описание сочетания';
      case 'precautions':
        return 'Описание меры предосторожности';
      case 'tips':
        return 'Содержание совета';
      case 'storageMethods':
        return 'Описание способа хранения';
      case 'variations':
        return 'Название варианта написания';
    }
    return '';
}
  
export function getNameOfControlGroup(controlGroup: string): string {
  switch (controlGroup) {
    case 'advantages':
      return 'Преимущества';
    case 'disadvantages':
      return 'Недостатки';
    case 'recommendations':
      return 'Рекоммендации';
    case 'contraindicates':
      return 'Противопоказания';
    case 'cookingMethods':
      return 'Способы приготовления';
    case 'compatibleDishes':
      return 'Сочетания';
    case 'precautions':
      return 'Меры предосторожности';
    case 'tips':
      return 'Советы';
    case 'storageMethods':
      return 'Способы хранения';
    case 'variations':
      return 'Варианты написания';
  }
  return '';
}