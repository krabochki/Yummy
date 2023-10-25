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
  selector: 'app-expanding-input',
  templateUrl: './expanding-input.component.html',
  styleUrls: ['./expanding-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExpandingInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandingInputComponent implements OnInit, OnChanges {
  disabled = false;
  @ViewChild('input') input?: ElementRef;
  @Input() placeholder: string = '';
  @Input() error: string = '';
  @Input() max: number | undefined = undefined;
  @Input() showError = true;

  @Input() value: string = '';

  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)
  @Input() inputRequired: boolean = false;
  getNotEmptyValue: boolean = false;

  change() {
    this.onChange(this.value);
  }
  ngOnInit() {
    if (this.inputRequired === true) {
      this.placeholder = this.placeholder + '*';
    }
  }
  ngOnChanges() {
    if (this.value !== '' && !this.getNotEmptyValue) {
      console.log(true);
      this.focus();
      this.blur();
      this.change();
    }
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
}
