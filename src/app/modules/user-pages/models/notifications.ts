export interface INotification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  context: 'category' | 'recipe' | 'without'|'comment';
  relatedLink: string,
  message: string; // Текст уведомления
  title: string;
  timestamp: string;
  read: boolean; // Флаг, указывающий, прочитано ли уведомление
}

export const nullNotification: INotification ={
  id: 0,
  relatedLink: '',
  context: 'without',
  type: 'success',
  message: '',
  title: '',
  timestamp: '',
  read: false

}