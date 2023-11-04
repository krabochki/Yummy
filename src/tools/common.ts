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