/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component, ElementRef, ViewChild , Input, OnInit, ChangeDetectionStrategy, forwardRef} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-password-input',
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
})
export class PasswordInputComponent implements OnInit {
  @ViewChild('input') input?: ElementRef;

  @Input() placeholder: string = ''; //плейсхолдер

  showPassword = true; //показывается ли пароль

  @Input() fitWidth: boolean = false;

  disabled = false;
  @Input() error: string = '';
  @Input() max: number = 20;
  @Input() showError = true;
  @Input() inputRequired: boolean = false;
  value = '';
  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)

  ngOnInit(): void {
    if (this.inputRequired === true) {
      this.placeholder = this.placeholder + '*';
    }
  }

  change() {
    this.onChange(this.value);
  }

  //Появление фокуса
  focus() {
    setTimeout(() => {
      this.input?.nativeElement.setSelectionRange(
        this.value.length,
        this.value.length,
      );
    });
    this.isSleep = false;
    this.isFocused = true;
  }

  //Исчезновение фокуса
  blur() {
    this.isFocused = false;
    if (this.value != '') {
      this.isFocused = true;
      this.isSleep = true;
    }
  }

  onChange: any = () => {
    //
  };
  onTouched: any = () => {
    //
  };
  writeValue(value: string): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  //Открытие/сокрытие пароля
  eye() {
    this.showPassword = !this.showPassword;
    this.input?.nativeElement.focus();
  }
}
