import { IUpdate } from 'src/app/modules/common-pages/components/updates/updates/const';
import { ICategory } from 'src/app/modules/recipes/models/categories';
import { IIngredient } from 'src/app/modules/recipes/models/ingredients';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';

export function notifyForAuthorOfBlockedComment(
  commentText: string,
  recipeName: string,
  recipeId:number
  ,  notificationService: NotificationService,
) {
  return notificationService.buildNotification(
    'Ваш комментарий удален по жалобе',
    `Ваш комментарий «${commentText}» под рецептом « ${recipeName} » удален по жалобе`,
    'error',
    'comment',
    '/recipes/list/' + recipeId,
  );
}

export function notifyForReporterOfBlockedComment(
  commentText: string,
  recipeName: string,
  recipeId: number,
  commentAuthorName: string,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Комментарий удален по твоей жалобе',
    `Ваша жалоба на комментарий пользователя ${
      commentAuthorName } «${commentText}» под рецептом «${
      recipeName
    }» принята`,
    'success',
    'comment',
    '/recipes/list/' + recipeId,
  );
}

export function notifyForReporterOfLeavedComment(
  authorName: string,
  recipeName: string,
  recipeId: number,
  commentText:string,
  notifyService: NotificationService,
): INotification {
  return notifyService.buildNotification(
    'Жалоба на комментарий отклонена',
    `Ваша жалоба на комментарий пользователя ${
      authorName
    } «${commentText}» под рецептом «${
      recipeName
    }» отклонена`,
    'error',
    'comment',
    '/recipes/list/' + recipeId,
  );
}

export function notifyForAuthorOfLeavedComment(
  commentText:string,
  recipeName:string,
  recipeId:number,
  notifyService: NotificationService,
): INotification {
  return notifyService.buildNotification(
    'Жалоба на комментарий отклонена',
    `Жалоба на ваш комментарий «${commentText}» под рецептом «${recipeName}» отклонена модератором. Комментарий сохранен!`,
    'info',
    'comment',
    '/recipes/list/' + recipeId,
  );
}

export function notifyForAuthorOfApprovedRecipe(
  approvedRecipe: IRecipe,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Рецепт одобрен',
    `Ваш рецепт «${approvedRecipe.name}» одобрен и теперь может просматриваться всеми кулинарами`,
    'success',
    'recipe',
    '/recipes/list/' + approvedRecipe.id,
  );
}
export function notifyForAuthorOfApprovedUpdate(
  approvedUpdate: IUpdate,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Новость одобрена',
    `Ваша новость «${approvedUpdate.shortName}» одобрена администратором`,
    'success',
    'without',
    '/news',
  );
}
export function notifyForFollowersOfApprovedRecipeAuthor(

  authorName:string,
  recipe: IRecipe,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Новый рецепт от кулинара',
    `Кулинар ${authorName}, на которого вы подписаны, поделился новым рецептом «${recipe.name}»`,
    'info',
    'recipe',
    '/recipes/list/' + recipe.id,
  );
}

export function getName(user: IUser): string {
  return user.fullName ? user.fullName : '@' + user.username;
}

export function notifyForAuthorOfDismissedRecipe(
  recipe: IRecipe,
  notifyService: NotificationService,
): INotification {
  return notifyService.buildNotification(
    'Рецепт отклонен',
    `Ваш рецепт «${recipe.name}» отклонен`,
    'error',
    'recipe',
    '',
  );
}

export function notifyForAuthorOfDismissedUpdate(
  update: IUpdate,
  notifyService: NotificationService,
): INotification {
  return notifyService.buildNotification(
    'Новость отклонена',
    `Ваша новость «${update.shortName}» отклонена администратором`,
    'error',
    'without',
    '',
  );
}

export function notifyForAuthorOfIngredient(
  ingredient: IIngredient,
  action: 'approve' | 'dismiss',
  notifyService: NotificationService,
): INotification {
  const verb = action === 'approve' ? 'одобрен' : 'отклонен';
  const link = action === 'approve' ? '/ingredients/list/' + ingredient.id : '';
  return notifyService.buildNotification(
    `Ингредиент ${verb}`,
    `Созданный вами и отправленный на проверку ингредиент «${ingredient.name}» ${verb}`,
    action === 'approve' ? 'success' : 'error',
    'ingredient',
    link,
  );
}

export function notifyForAuthorOfDismissedCategory(
  category: ICategory,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Категория отклонена',
    `Ваша категория «${category.name}» отклонена`,
    'error',
    'category',
    '',
  );
}

export function notifyForAuthorOfApprovedCategory(
  category: ICategory,
  notifyService: NotificationService,
) {
  const link: string = '/categories/list/' + category.id;
  return notifyService.buildNotification(
    'Категория одобрена',
    `Твоя категория «${category.name}» одобрена и теперь может просматриваться всеми кулинарами`,
    'success',
    'category',
    link,
  );
}

export function notifyForDemotedUser(
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Вас разжаловали',
    `Вы теперь не являетесь модератором сайта Yummy`,
    'warning',
    'demote',
    '',
  );
}
