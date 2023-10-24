import { Component, ElementRef, HostListener, Input, OnInit, ViewChild, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-usual-input',
  templateUrl: './usual-input.component.html',
  styleUrls: ['./usual-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UsualInputComponent),
      multi: true,
    },
  ],
})
export class UsualInputComponent implements OnInit {
  disabled = false;
  @ViewChild('input') input?: ElementRef;
  @Input() placeholder: string = '';
  @Input() error: string = '';
  @Input() max: number | undefined = undefined;
  @Input() showError = true;

  value = '';

  @Input()  inputRequired:boolean = false;

  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)

  ngOnInit() {
    if (this.inputRequired===true) {
      this.placeholder=this.placeholder+'*'
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

  onChange: any = () => {};
  onTouched: any = () => {};
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
