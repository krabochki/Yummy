/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountInputComponent {
  @Input() min?: number;
  @Input() max?: number;
  @Input() value: number = 0;
  @Input() readonly: boolean = false;
  disabled = false;
  onChange: any = () => {
    //
  };
  onTouched: any = () => {
    //
  };

  get val() {
    return Number(this.value);
  }

  increase() {
    if (typeof this.max === 'undefined') {
      this.value = this.value + 1
      this.onChange(this.value);
    } else if (Number(this.value) < this.max) {
      this.value =  this.value+1
      this.onChange(this.value);
    }
  }

  decrease() {
    if (typeof this.min === 'undefined') {
      this.value = this.value - 1;
      this.onChange(this.value);
    } else if (Number(this.value) > this.min) {
      this.value = this.value - 1;
      this.onChange(this.value);
    }
  }

  writeValue(value: number): void {
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
