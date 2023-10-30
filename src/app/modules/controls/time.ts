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
    return 'Несколько секунд назад';
  }
  if (diff.seconds < 59) {
    return (
      diff.seconds +
      ' ' +
      pluralRu(diff.seconds, ['секунду', 'секунды', 'секунд']) +
      ' назад'
    );
  }
  if (diff.seconds < 90) {
    return 'Около минуты назад';
  }
  if (diff.minutes < 45) {
    return (
      diff.minutes +
      ' ' +
      pluralRu(diff.minutes, ['минуту', 'минуты', 'минут']) +
      ' назад'
    );
  }
  if (diff.minutes < 90) {
    return '1 час назад';
  }
  if (diff.hours < 22) {
    return (
      diff.hours +
      ' ' +
      pluralRu(diff.hours, ['час', 'часа', 'часов']) +
      ' назад'
    );
  }
  if (diff.hours < 36) {
    return '1 день назад';
  }

  if (diff.days < 25) {
    return (
      diff.days + ' ' + pluralRu(diff.days, ['день', 'дня', 'дней']) + ' назад'
    );
  }

  if (diff.days < 45) {
    return '1 месяц назад';
  }
  if (diff.days < 356) {
    return (
      diff.months +
      ' ' +
      pluralRu(diff.months, ['месяц', 'месяца', 'месяцев']) +
      ' назад'
    );
  }
  if (diff.days < 545) {
    return '1 год назад';
  }
  if (diff.days >= 545) {
    return diff.years + diff.years === 1
      ? 'год'
      : diff.years === 2 || diff.years === 3 || diff.years === 4
      ? 'года'
      : 'лет' + 'назад';
  } else {
    return defaultTimeDiffGenerator(diff);
  }
};
