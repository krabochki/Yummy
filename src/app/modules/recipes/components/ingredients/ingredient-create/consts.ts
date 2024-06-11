import { AbstractControl, FormGroup } from "@angular/forms";
import { ExternalLink, IIngredient, nullIngredient } from "../../../models/ingredients";

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
      'Перечислите приблизительные характеристики нутриентов ингредиента.<br><br>Поставьте в начало названия нутриента три восклицательных знака !!!, чтобы обозначить начало новой группы нутриентов и её название. Например, !!!КБЖУ (далее калории, белки, жиры, углеводы), !!!Витамины (далее список витаминов).',
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
        return 'Вариант написания названия';
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
      return 'Варианты написания названия';
  }
  return '';
}

export const stepControlGroups = [
  ['advantages', 'disadvantages', 'recommendations', 'contraindicates'],
  ['cookingMethods', 'compatibleDishes', 'precautions'],
  ['tips', 'storageMethods'],
];

export function getIngredientByForm(form: FormGroup, controls:AbstractControl[]) {
  const externalLinks: ExternalLink[] = [];
  
  controls.forEach((control) => {
  const externalLink: ExternalLink = {
    link: control.get('link')?.value,
    name: control.get('name')?.value,
  };
  externalLinks.push(externalLink);
});
  const ingredient: IIngredient = {
    ...nullIngredient,
    name: form.value.ingredientName,
    history: form.value.history,
    description: form.value.description,
    variations: form.value.variations.map(
      (item: { content: string }) => item.content,
    ),
    advantages: form.value.advantages.map(
      (item: { content: string }) => item.content,
    ),
    disadvantages: form.value.disadvantages.map(
      (item: { content: string }) => item.content,
    ),
    recommendedTo:form.value.recommendations.map(
      (item: { content: string }) => item.content,
    ),
    contraindicatedTo: form.value.contraindicates.map(
      (item: { content: string }) => item.content,
    ),
    origin: form.value.origin,
    precautions: form.value.precautions.map(
      (item: { content: string }) => item.content,
    ),
    compatibleDishes: form.value.compatibleDishes.map(
      (item: { content: string }) => item.content,
    ),
    cookingMethods: form.value.cookingMethods.map(
      (item: { content: string }) => item.content,
    ),
    tips: form.value.tips.map((item: { content: string }) => item.content),
    nutritions:form.value.nutritions,
    storageMethods: form.value.storageMethods.map(
      (item: { content: string }) => item.content,
    ),
    externalLinks: externalLinks,
  };

  return ingredient;
}