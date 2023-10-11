import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {


  @Input() style:'filled'|'filled-min'|'outlined'|'banner'|undefined;
  @Input() color:'prim'|'sec'|undefined;
  @Input() rounded:boolean|undefined;
  @Input() text:string = 'Button';

  getClass(){

    const styleClasses = [];

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
      case 'sec':
        styleClasses.push('sec');
        break;
      default:
        break;
    }
    switch(this.rounded){
      case true:
        styleClasses.push('rounded');
        break;
        case false:
          styleClasses.push('unrounded');
          break;
    }
  
    return styleClasses;
  }

}
