/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
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
  @Input() onlyNumbers = false;
  @Input() max: number | undefined = undefined;
  @Input() showError = true;
  @Input() value = '';
  @Input() rows = 3;
  @Input() inputDisabled: boolean = false;
  @Input() inputType: 'input' | 'textarea' | 'password' = 'input';
  @Input() inputRequired: boolean = false;
  @Output() blurEmitter = new EventEmitter<boolean>();
  @Output() focusEmitter = new EventEmitter<boolean>();
  @Output() enterEmitter = new EventEmitter();

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

  enter() {
    this.enterEmitter.emit();
  }

  change() {
    this.onChange(this.value);
  }

  //Появление фокуса
  focus() {
    if (this.inputType === 'password')
      setTimeout(() => {
        this.input?.nativeElement.setSelectionRange(
          this.value.length,
          this.value.length,
        );
      });
    this.isFocused = true;
    this.isSleep = false;
    this.focusEmitter.emit(true);
  }

  //Исчезновение фокуса
  blur() {
    this.isFocused = false;
    if (this.value != '') {
      this.isFocused = true;
      this.isSleep = true;
    }
    this.blurEmitter.emit(true);
  }

  filter() {
    if (this.onlyNumbers) {
      this.value = this.value.replace(/[^0-9.,]/g, '');
      if (
        this.value[0] === '0' &&
        this.value.length > 1 &&
        this.value[1] !== ',' &&
        this.value[1] !== '.'
      )
        this.value = this.value.substring(1);
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
