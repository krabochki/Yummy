import {
  CUSTOM_TIME_DIFF_GENERATOR,
  defaultTimeDiffGenerator,
  TimePastPipe,
  TimeDiffGenerator,
} from 'ng-time-past-pipe';

//Кастомизация timeDiffPipe (русский текст)
export function pluralRu(object:number,variants:string[]):string {
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
    return diff.isFuture ? 'Через несколько секунд' : 'Несколько секунд назад';
  }
  if (diff.minutes < 60) {
    //....и тд
    return diff.minutes + pluralRu(diff.minutes, ['минута', 'минуты', 'минут']) + ' назад' 
  }
  else {
    return defaultTimeDiffGenerator(diff);
  }
  
};
