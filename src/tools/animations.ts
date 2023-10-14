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


export function slide() {
  return [
   transition(':enter', [
        style({transform: 'translateX(-140%)'}),
        animate('500ms ease-in', style({transform: 'translateX(0%)'}))
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({transform: 'translateX(-100%)'})),
      ]),

];

    

}


export function slideReverse() {
  return [
    transition(':enter', [
      style({ transform: 'translateX(140%)' }),
      animate('600ms ease-in', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [
      animate('400ms ease-in', style({ transform: 'translateX(100%)' })),
    ]),

  ];

}