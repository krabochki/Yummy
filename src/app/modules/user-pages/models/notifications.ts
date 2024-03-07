export interface INotification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'night-mode';
  context:
    | 'category'
    | 'hire'
    | 'recipe'
    | 'manager'
    | 'without'
    | 'update'
    | 'comment'
    | 'born'
    | 'user'
    | 'ingredient'
    | 'plan-reminder'
    | 'calendar-recipe'
    | 'demote'
    | 'plan-reminder-start';
  relatedId: number;
  link: string;
  message: string; // Текст уведомления
  title: string;
  userId?: number;
  sendDate: string;
  read: 0 | 1; // Флаг, указывающий, прочитано ли уведомление
  notificationDate: string; // Дата отправки уведомления
}

export const nullNotification: INotification = {
  id: 0,
  link: '',
  context: 'without',
  type: 'success',
  relatedId: 0,
  message: '',
  title: '',

  sendDate: '',
  read: 0,
  notificationDate: '',
};