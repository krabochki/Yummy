import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-count-input',
  templateUrl: './count-input.component.html',
  styleUrls: ['./count-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountInputComponent),
      multi: true,
    },
  ],
})
export class CountInputComponent {
  @Input() min?: number;
  @Input() max?: number;
  disabled = false;

  @Input() readonly: boolean = false;
  value: string = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor() {}

  increase() {
    if (typeof this.max === 'undefined') {
      this.value = (Number(this.value) + 1).toString();
      this.onChange(this.value);
    } else if (Number(this.value) < this.max) {
      this.value = (Number(this.value) + 1).toString();
      this.onChange(this.value);
    }
  }

  decrease() {
    if (typeof this.min === 'undefined') {
      this.value = (Number(this.value) - 1).toString();
      this.onChange(this.value);
    } else if (Number(this.value) > this.min) {
      this.value = (Number(this.value) - 1).toString();
      this.onChange(this.value);
    }
  }

  input() {
    this.value = this.value.replace(',,', ',');

    if (this.value.includes(',')) {
      this.value = this.value.replace(/[^\d,]/g, '').slice(0, 5);
    } else {
      this.value = this.value.replace(/[^\d,]/g, '').slice(0, 4);
    }
    if (this.value === '0') this.value = '1';
  }
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
  get val() {
    return Number(this.value);
  }

}
