import { ICategory } from 'src/app/modules/recipes/models/categories';
import { IComment } from 'src/app/modules/recipes/models/comments';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { IUser } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';

export function notifyForAuthorOfBlockedComment(
  blockedComment: IComment,
  recipeWithComment: IRecipe,
  notificationService: NotificationService,
) {
  return notificationService.buildNotification(
    'Ваш комментарий удален по жалобе',
    `Ваш комментарий «${blockedComment.text}» под рецептом « ${recipeWithComment.name} » удален по жалобе`,
    'error',
    'comment',
    '/recipes/list/' + recipeWithComment.id,
  );
}

export function notifyForReporterOfBlockedComment(
  blockedComment: IComment,
  recipeWithComment: IRecipe,
  authorOfBlockedComment: IUser,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Комментарий удален по твоей жалобе',
    `Ваша жалоба на комментарий пользователя ${
      authorOfBlockedComment.fullName
        ? authorOfBlockedComment.fullName
        : '@' + authorOfBlockedComment.username
    } «${blockedComment.text}» под рецептом «${
      recipeWithComment.name
    }» принята`,
    'success',
    'comment',
    '/recipes/list/' + recipeWithComment.id,
  );
}

export function notifyForReporterOfLeavedComment(
  authorOfLeavedComment: IUser,
  recipeWithComment: IRecipe,
  leavedComment: IComment,
  notifyService: NotificationService,
): INotification {
  return notifyService.buildNotification(
    'Жалоба на комментарий отклонена',
    `Ваша жалоба на комментарий пользователя ${
      authorOfLeavedComment.fullName
        ? authorOfLeavedComment.fullName
        : '@' + authorOfLeavedComment.username
    } «${leavedComment.text}» под рецептом «${
      recipeWithComment.name
    }» отклонена`,
    'error',
    'comment',
    '/recipes/list/' + recipeWithComment.id,
  );
}

export function notifyForAuthorOfLeavedComment(
  leavedComment: IComment,
  recipeWithComment: IRecipe,
  notifyService: NotificationService,
): INotification {
  return notifyService.buildNotification(
    'Жалоба на комментарий отклонена',
    `Жалоба на ваш комментарий «${leavedComment.text}» под рецептом «${recipeWithComment.name}» отклонена модератором. Комментарий сохранен!`,
    'info',
    'comment',
    '/recipes/list/' + recipeWithComment.id,
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

export function notifyForFollowersOfApprovedRecipeAuthor(
  author: IUser,
  recipe: IRecipe,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Новый рецепт от кулинара',
    `Кулинар ${getName(
      author,
    )}, на которого вы подписаны, поделился новым рецептом «${recipe.name}»`,
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
  user: IUser,
  notifyService: NotificationService,
) {
  return notifyService.buildNotification(
    'Вас разжаловали',
    `Вы теперь не являетесь модератором сайта Yummy. Вас разжаловал администратор ${getName(
      user,
    )}`,
    'warning',
    'demote',
    `/cooks/list/${user.id}`,
  );
}
