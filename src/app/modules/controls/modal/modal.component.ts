import { trigger, transition, style, animate } from '@angular/animations';
import { Component, ComponentFactoryResolver, ComponentRef, EventEmitter, Input, Output, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
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
