import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceNewline',
})
export class ReplaceNewlinePipe implements PipeTransform {
  transform(value: string): string {
    if (value) {
      // Заменяем переносы строк на теги <br>
      return value.replace(/\n/g, '<br><br>');
    }
    return value;
  }
}
