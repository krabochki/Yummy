import { defaultTimeDiffGenerator, TimeDiffGenerator } from 'ng-time-past-pipe';

//Кастомизация timeDiffPipe (русский текст)
export function pluralRu(object: number, variants: string[]): string {
  return object % 10 === 1 && object % 100 !== 11
    ? variants[0]
    : object % 10 >= 2 &&
      object % 10 <= 4 &&
      (object % 100 < 10 || object % 100 >= 20)
    ? variants[1]
    : variants[2];
}

export const timeDiffGenerator: TimeDiffGenerator = (diff): string => {
  if (diff.seconds <= 5) {
    if (diff.isFuture)
      return 'Через несколько секунд';
    return 'Несколько секунд назад';
  }
  if (diff.seconds < 59) {
    if (diff.isFuture) return (
      'Через '+ diff.seconds +
      ' ' +
      pluralRu(diff.seconds, ['секунду', 'секунды', 'секунд'])
    );
    return (
      diff.seconds +
      ' ' +
      pluralRu(diff.seconds, ['секунду', 'секунды', 'секунд']) +
      ' назад'
    );
  }
  if (diff.seconds < 90) {
    if(diff.isFuture) return 'Через 1 минуту'
    return 'Около минуты назад';
  }
  if (diff.minutes < 45) {
    if(diff.isFuture) return (
      'Через' +
      diff.minutes +
      ' ' +
      pluralRu(diff.minutes, ['минуту', 'минуты', 'минут'])
    );
    return (
      diff.minutes +
      ' ' +
      pluralRu(diff.minutes, ['минуту', 'минуты', 'минут']) +
      ' назад'
    );
  }
  if (diff.minutes < 90) {
    if (diff.isFuture)
      return ('Через 1 час')
    return '1 час назад';
  }
  if (diff.hours < 24) {
    if (diff.isFuture)
      return (
        'Через '+diff.hours +
        ' ' +
        pluralRu(diff.hours, ['час', 'часа', 'часов'])      );
    return (
      diff.hours +
      ' ' +
      pluralRu(diff.hours, ['час', 'часа', 'часов']) +
      ' назад'
    );
  }
  if (diff.hours < 36) {
    if(diff.isFuture) return 'Послезавтра'
    return 'Позавчера';
  }

  if (diff.days < 25) {
     if (diff.isFuture)
       return (
         'Через ' +
         diff.days +
         ' ' +
         pluralRu(diff.days, ['день', 'дня', 'дней'])
       );
    return (
      diff.days + ' ' + pluralRu(diff.days, ['день', 'дня', 'дней']) + ' назад'
    );
  }

  if (diff.days < 45) {
     if (diff.isFuture)
       return (
         'Через 1 месяц'
       );
    return '1 месяц назад';
  }
  if (diff.days < 356) {
    if (diff.isFuture) return (
     'Через '+ diff.months +
      ' ' +
      pluralRu(diff.months, ['месяц', 'месяца', 'месяцев'])
    );
    return (
      diff.months +
      ' ' +
      pluralRu(diff.months, ['месяц', 'месяца', 'месяцев']) +
      ' назад'
    );
  }
  if (diff.days < 545) {
    if (diff.isFuture)
      return 'Через 1 год'
    return '1 год назад';
  }
  if (diff.days >= 545) {
    if (diff.isFuture) return diff.years === 1
      ? 'Через '+diff.years + ' год'
      : diff.years === 2 || diff.years === 3 || diff.years === 4
      ? 'Через '+ diff.years + ' года'
      : 'Через '+diff.years + ' лет';
    
    return diff.years === 1
      ? diff.years + ' год назад'
      : diff.years === 2 || diff.years === 3 || diff.years === 4
      ? diff.years + ' года назад'
      : diff.years + ' лет назад';
  } else {
    return defaultTimeDiffGenerator(diff);
  }
};
