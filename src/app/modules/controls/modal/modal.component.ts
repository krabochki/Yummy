import { trigger, transition, style, animate } from '@angular/animations';
import { Component, ComponentFactoryResolver, ComponentRef, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  animations: [
    trigger('modal', [
      transition(':enter', [
        style({ opacity: '0' }),
        animate('300ms ease-out', style({ opacity: '1' })),
      ]),
      transition(':leave', [
        style({ opacity: '1' }),
        animate('300ms ease-in', style({ opacity: '0' })),
      ]),
    ]),
  ],
})
export class ModalComponent {
  @Input() type?: 'yesOrNo' | 'Ok';
  @Input() title?: string;
  @Input() description?: string;
  @Input() buttonsText: string[] = ['Да', 'Нет'];
  @Input() style: 'prim' | 'sec' = 'prim';

  @Output() resultEmit: EventEmitter<boolean> = new EventEmitter<boolean>();

  onOkClick() {
    this.resultEmit.emit(true); // Отправляем значение true в родительский компонент
  }

  onNoClick() {
    this.resultEmit.emit(false); // Отправляем значение false в родительский компонент
  }
}
