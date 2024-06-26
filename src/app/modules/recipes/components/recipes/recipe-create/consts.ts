import { role } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { FormGroup } from '@angular/forms';

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

    description: `Перечислите все ингредиенты, необходимые для приготовления вашего блюда. Укажите каждый ингредиент отдельно, с указанием количества и единиц измерения. Если вы укажете количество игредиентов в числовом формате, кулинары смогут настраивать количество порций и ингредиентов для них под свои потребности! <br><br>
    Поставьте в начало названия ингредиента три восклицательных знака !!!, чтобы обозначить начало новой
                                            группы ингредиентов и её название. Например, !!!Для коржа, !!!Для крема, !!!Для глазури (далее списки
                                            соответствующих ингредиентов). <br><br>
       Если вы вводите название (или вариацию названия) ингредиента, страница которого существует на сайте, то ваш рецепт можно будет найти через страницу этого ингредиента, а также в списке ингредиентов созданного рецепта можно будет перейти на ссылку с более подробным описанием этого ингредента.
       `,
  },
  {
    title: 'Нутриенты',

    shortTitle: 'Нутриенты',
    description:
    `Перечислите информацию о пищевой ценности рецепта, такую как количество белков, жиров, углеводов, калорий и других питательных веществ. Эти данные важны для тех, кто следит за своей диетой или интересуется пищевой ценностью блюда. <br><br>
                  Поставьте в начало названия нутриента три восклицательных знака !!!, чтобы обозначить начало новой
              группы нутриентов и её название. Например, !!!КБЖУ (далее калории, белки, жиры, углеводы), !!!Витамины (далее список
              витаминов).`,
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

export function noValidStepDescription(step: number): string {
  switch (step) {
    case 0:
      return 'Название рецепта (минимум 3 символа) и описание рецепта (минимум 15 символов) обязательны для заполнения';
    case 1:
      break;
    case 2:
      return 'У рецепта должно быть не более 5 категорий';
    case 3:
      return 'Название для каждого ингредиента рецепта обязательно и должно содержать не менее 2 и не более 50 символов';
    case 4:
      return 'Название для каждого нутриента рецепта обязательно и должно содержать не менее 2 и не более 20 символов';
    case 5:
      return 'Содержание для каждой инструкции рецепта обязательно и должно содержать не менее 2 и не более 1000 символов';
  }
  return '';
}

export function getFileFromBlob(blob: Blob): File {
  const mimeType = blob.type; // Получаем mime-тип из Blob

  let extension = mimeType.split('/')[1]; // Получаем расширение файла из mime-типа

  if (mimeType.includes('svg+xml')) {
    extension = 'svg';
  } else if (mimeType.includes('png')) {
    extension = 'png';
  } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    extension = 'jpg';
  }

  const filename = `image.${extension}`; // Формируем имя файла с расширением
  return new File([blob], filename, {
    type: mimeType,
  });
}

export function notifyForEditedRecipeAuthor(
  notifyService: NotificationService,
  awaits: boolean,
  role: role,
  recipe: IRecipe,
) {
  const user = role === 'user';
  return notifyService.buildNotification(
    awaits
      ? `Рецепт изменен ${user ? 'и отправлен на проверку' : 'и опубликован'}`
      : 'Рецепт изменен',
    `Рецепт «${recipe.name}» изменен ${
      awaits ? (user ? 'и успешно отправлен на проверку' : 'и опубликован') : ''
    }`,
    'success',
    'recipe',
    '/recipes/list/' + recipe.id,
  );
}

export function getRecipeByForm(form: FormGroup) {
  const recipe: IRecipe = {
    ...nullRecipe,
    name: form.value.recipeName,
    instructions: form.value.instructions,
    ingredients: form.value.ingredients,
    description: form.value.description,
    history: form.value.history,
    preparationTime: form.value.preparationTime,
    cookingTime: form.value.cookingTime,
    origin: form.value.origin,
    nutritions: form.value.nutritions,
    servings: form.value.portions,
  };

  recipe.ingredients.forEach((ingredient) => {
    if (ingredient.quantity) {
      ingredient.quantity = ingredient.quantity.replace(',', '.');
    }
  });

  return recipe;
}
