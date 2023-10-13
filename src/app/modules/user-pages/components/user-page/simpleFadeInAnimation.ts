import { style, animate, transition } from '@angular/animations';

export function fadeIn() {
  return [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('400ms ease-in', style({ opacity: 1 })),
    ]),
  ];
}

export function modal() {
    
    return [
      transition(':enter', [
        style({ opacity: '0' }),
        animate('500ms ease-out', style({ opacity: '1' })),
      ]),
      transition(':leave', [
        style({ opacity: '1' }),
        animate('500ms ease-in', style({ opacity: '0' })),
      ]),
    ];
}