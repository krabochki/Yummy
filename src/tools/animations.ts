import { style, animate, transition } from '@angular/animations';

export function fadeIn() {
  return [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('400ms ease-in', style({ opacity: 1 })),
    ]),
  ];
}

export function notifies() {
  return [
    transition(':enter', [
      style({ 'transform': 'translateX(15em)' }),
      animate('400ms ease-in-out', style({ 'transform': 'translateX(0)' })),
    ]),
    transition(':leave', [
      style({ 'transform': 'translateX(0)' }),
      animate('400ms ease-in-out', style({ 'transform': 'translateX(15em)' })),
    ]),
  ];
}

export function count() {
  return [
    transition(':enter', [
      style({ 'scale': '0' }),
      animate('300ms ease-in-out', style({ 'scale': '100%' })),
    ]),
    transition(':leave', [
      style({ 'scale': '100%' }),
      animate('300ms ease-in-out', style({ 'scale': '0' })),
    ]),
  ];
}




export function modal() {
  return [
    transition(':enter', [
      style({ opacity: '0' }),
      animate('250ms ease-in-out', style({ opacity: '1' })),
    ]),
    transition(':leave', [
      style({ opacity: '1' }),
      animate('250ms ease-in-out', style({ opacity: '0' })),
    ]),
  ];
}

export function slide() {
  return [
    transition(':enter', [
      style({ transform: 'translateX(-140%)' }),
      animate('500ms ease-in', style({ transform: 'translateX(0%)' })),
    ]),
    transition(':leave', [
      animate('500ms ease-in', style({ transform: 'translateX(-100%)' })),
    ]),
  ];
}

export function slideReverse() {
  return [
    transition(':enter', [
      style({ transform: 'translateX(140%)' }),
      animate('600ms ease-in', style({ transform: 'translateX(0%)' })),
    ]),
    transition(':leave', [
      animate('400ms ease-in', style({ transform: 'translateX(100%)' })),
    ]),
  ];
}

export function onlyHeight() {
  return [
    transition(':enter', [
      style({ height: '0', overflow: 'hidden' }),
      animate('300ms ease-out', style({ height: '*' , overflow:'visible'})),
    ]),
    transition(':leave', [
      style({ height: '*',overflow:'visible' }),
      animate('300ms ease-in', style({ height: '20px',overflow:'hidden' })),
    ]),
  ];
}

export function heightAnim() {
  return [
    transition(':enter', [
      style({ height: '0', opacity: '0','overflow':'hidden' }),
      animate('300ms ease-in', style({ height: '*', opacity: '1','overflow':'visible' })),
    ]),
    transition(':leave',
    
      
      [style({ 'overflow':'hidden'}),
      animate('300ms ease-in', style({ height: '0', opacity: '0' })),
    ]),
  ];
}

export function widthAnim() {
  return [
    transition(':enter', [
      style({ opacity: '0', width: '0' }),
      animate('500ms ease-out', style({ opacity: '1', width: '*' })),
    ]),
    transition(':leave', [
      style({ opacity: '1', width: '*' }),
      animate('500ms ease-in', style({ opacity: '0', width: '0' })),
    ]),
  ];
}
