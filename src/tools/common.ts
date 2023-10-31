export function getCurrentDate():string{
     return new Date().toJSON()
}

  export function getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    let minutes = date.getMinutes().toString();
    if (Number(minutes) < 10) minutes = '0' + minutes;

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }