/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component, ElementRef, HostListener, ViewChild , Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent {
  @ViewChild('input') myInput?: ElementRef;

  @Output() inputValueChange = new EventEmitter<string>(); //передача значения инпут

  @Input() placeholder: string = ''; //плейсхолдер
  @Input() max: number = 1000; //макс. значение
  @Input() type: 'textarea' | 'input' = 'input'; //расширяющийся ли инпут

  @Input() password: boolean = false; //является ли поле парольным

  @Input() required = false; //есть ли условия для поля
  @Input() warningText = ''; //текст при некорректном значении
  @Input() mask?: RegExp; //маска для проверки

  showPassword = true; //показывается ли пароль
  value: string = ''; //значение инпута
  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)


  warningShow = false;

  //Появление фокуса

  @HostListener('focus', ['$event'])
  onFocus(event: Event): void {
    setTimeout(() => {
      this.myInput?.nativeElement.setSelectionRange(
        this.value.length,
        this.value.length,
      );
    });
    this.isSleep = false;
    this.isFocused = true;
 
  }

  //Исчезновение фокуса
  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    this.isFocused = false;
    if (this.value != '') {
      this.isFocused = true;
      this.isSleep = true;
    }
  }

  //Изменение значения
  @HostListener('focus', ['$event'])
  onKeyUp(event: Event): void {
    this.inputValueChange.emit(this.value);
       if (this.required && !this.warningShow) {
         this.warningShow = true;
       }
  }

  //Открытие/сокрытие пароля
  eye() {
    this.showPassword = !this.showPassword;
    this.myInput?.nativeElement.focus();
  }

  //Проверяем значение на соответствие маске
  testMask() {
    return this.mask?.test(this.value);
  }
}

