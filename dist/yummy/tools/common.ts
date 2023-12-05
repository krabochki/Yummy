/* eslint-disable @typescript-eslint/no-explicit-any */

import { Renderer2 } from "@angular/core";

export function getCurrentDate():string{
     return new Date().toJSON()
}

  export function getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    let day = date.getDate().toString();
    let month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();
    let hours = date.getHours().toString();
    let minutes = date.getMinutes().toString();
    if (Number(minutes) < 10) minutes = '0' + minutes;
    if (Number(day) < 10) day = '0' + day;
    if (Number(month) < 10) month = '0' + month;
    if (Number(hours) < 10) hours = '0' + hours;

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}
  

export function dateComparator(dateA:Date, dateB:Date) {
return (dateA > dateB) ? 1 :-1;
}   

export function baseComparator(a: any, b: any) {
  if (a > b) return 1;
  else return -1;
}



export function dragStart() {
   const bodyElement: HTMLElement = document.body;
   bodyElement.classList.add('inheritCursors');
   bodyElement.style.cursor = 'grabbing';
}
  
export function dragEnd() {
     const bodyElement: HTMLElement = document.body;

  bodyElement.classList.remove('inheritCursors');
  bodyElement.style.cursor = 'unset';
}


export function getZoom(count: number, diff:number, maxZoom?:number, baseZoom?: number): number {
  if (!baseZoom) baseZoom = 1;
    if (count > 1) {
      if (maxZoom && count > maxZoom) count = maxZoom;
      const zoomValue = baseZoom + (count - 1) * diff;
      return zoomValue;
    } else {
      return baseZoom;
    }
  }

  export function setReadingTimeInMinutes(text:string): number {
 
    const wordsPerMinute = 200;
    const recipeText = text;
    const words = recipeText.split(/\s+/);
    const wordCount = words.length;
    return Math.ceil(wordCount / wordsPerMinute);
}


export function formatRussianDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
  };

  const formatter = new Intl.DateTimeFormat('ru-RU', options);
  return formatter.format(date);
}

export function getZodiacSign(date: Date): string {
  const month = date.getMonth() + 1; // Месяцы в JavaScript начинаются с 0, поэтому прибавляем 1
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return 'Овен';
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return 'Телец';
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return 'Близнецы';
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return 'Рак';
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return 'Лев';
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return 'Дева';
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return 'Весы';
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return 'Скорпион';
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return 'Стрелец';
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return 'Козерог';
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return 'Водолей';
  } else {
    return 'Рыбы';
  }
}


export function addModalStyle(renderer:Renderer2) {
    renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    renderer.addClass(document.body, 'hide-overflow');
}
export function removeModalStyle(renderer: Renderer2) {
   renderer.removeClass(document.body, 'hide-overflow');
   (<HTMLElement>document.querySelector('.header')).style.width = '100%';
}