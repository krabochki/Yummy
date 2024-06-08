export function showContext(context: string) {
  switch (context) {
    case 'all':
      return 'Уведомить всех кулинаров';
    case 'managers':
      return 'Уведомить модераторов и администратора';
    case 'nobody':
      return 'Никого не уведомлять';
  }
  return '';
}
