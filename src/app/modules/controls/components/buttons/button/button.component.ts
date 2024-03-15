import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements OnChanges {
  @Input() icon: string = '';
  @Input() iconStyle: 'white' | 'as-text' = 'white';
  @Input() iconSize: 'min' | 'max' = 'max';
  @Input() iconPosition: 'after' | 'before' = 'after';
  @Input() style: 'filled' | 'filled-min' | 'outlined' | 'banner' | undefined;
  @Input() color: 'prim' | 'sec' |'admin'|'moderator'| 'vote' | undefined | 'await';
  @Input() rounded: boolean | undefined;
  @Input() text: string = 'Button';
  @Input() disabled: boolean = true;

  ngOnChanges() {
    this.cd.markForCheck();
  }

  constructor(private cd: ChangeDetectorRef) {}
  getClass() {
    const styleClasses = [];
    if (this.iconPosition === 'before') {
      styleClasses.push('before');
    }
    if (this.iconSize === 'min') {
      styleClasses.push('min-icon')
    }

    switch (this.style) {
      case 'filled':
        styleClasses.push('filled');
        break;
      case 'filled-min':
        styleClasses.push('filled-min');
        break;
      case 'outlined':
        styleClasses.push('outlined');
        break;
      case 'banner':
        styleClasses.push('banner');
        break;
      default:
        break;
    }

    switch (this.color) {
      case 'prim':
        styleClasses.push('prim');
        break;
      case 'vote':
        styleClasses.push('vote');
        break;
      case 'await':
        styleClasses.push('await');
        break;
      case 'admin':
        styleClasses.push('admin');
        break;
      case 'sec':
        styleClasses.push('sec');
        break;
      case 'moderator':
        styleClasses.push('moder');
        break;
      default:
        break;
    }
    switch (this.rounded) {
      case true:
        styleClasses.push('rounded');
        break;
      case false:
        styleClasses.push('unrounded');
        break;
    }

    if (!this.disabled) {
      styleClasses.push('disabled');
    }

    return styleClasses;
  }
}
