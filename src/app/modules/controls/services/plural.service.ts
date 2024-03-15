import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PluralizationService {
    getPluralForm(value: number, variants: string[]): string {
      
    if (value % 10 === 1 && value % 100 !== 11) {
      return variants[0];
    } else if (
      value % 10 >= 2 &&
      value % 10 <= 4 &&
      (value % 100 < 10 || value % 100 >= 20)
    ) {
      return variants[1];
    } else {
      return variants[2];
    }
  }
}
