export interface INotification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  context:
  | 'category'
  |'hire'
    | 'recipe'
    | 'without'
    | 'comment'
    | 'user'
  | 'plan-reminder'
  | 'calendar-recipe'
  |'demote'
  | 'plan-reminder-start',
  relatedId:number,
  relatedLink: string;
  message: string; // Текст уведомления
  title: string;
  timestamp: string;
  read: boolean; // Флаг, указывающий, прочитано ли уведомление
  notificationDate: string; // Дата отправки уведомления
}

export const nullNotification: INotification ={
  id: 0,
  relatedLink: '',
  context: 'without',
  type: 'success',
  relatedId:0,
  message: '',
  title: '',
  timestamp: '',
  read: false,
  notificationDate: ''

}