
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
