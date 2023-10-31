/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-usual-input',
  templateUrl: './usual-input.component.html',
  styleUrls: ['./usual-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UsualInputComponent),
      multi: true,
    },
  ],
})
export class UsualInputComponent implements OnInit, OnChanges {
  disabled = false;
  @ViewChild('input') input?: ElementRef;
  @Input() placeholder: string = '';
  @Input() error: string = '';
  @Input() max: number | undefined = undefined;
  @Input() showError = true;
  @Input() value = '';
  @Input() inputType: 'input' | 'textarea' | 'password' = 'input';
  @Input() inputRequired: boolean = false;

  showPassword = true; //показывается ли пароль

  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)
  getNotEmptyValue: boolean = false; //есть ли значение изначально и обработали ли мы его

  ngOnInit() {
    if (this.inputRequired === true) {
      this.placeholder = this.placeholder + '*';
    }
  }

  ngOnChanges() {
    if (this.value !== '' && !this.getNotEmptyValue && !this.isFocused) {
      this.focus();
      this.blur();
      this.change();
      this.getNotEmptyValue = true;
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
    this.isFocused = true;
    this.isSleep = false;
  }

  //Исчезновение фокуса
  blur() {
    this.isFocused = false;
    if (this.value != '') {
      this.isFocused = true;
      this.isSleep = true;
    }
  }

  eye() {
    this.showPassword = !this.showPassword;
    this.input?.nativeElement.focus();
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
}
