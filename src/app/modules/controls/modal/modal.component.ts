import { ChangeDetectionStrategy, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() type?: 'yesOrNo' | 'Ok';
  @Input() title?: string;
  @Input() description?: string;
  @Input() noButtons: boolean = false;
  @Input() buttonsText: string[] = ['Да', 'Нет'];
  @Input() style: 'prim' | 'sec' | 'await' = 'prim';

  @Output() resultEmit: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width='calc(100% - 16px)'
    this.renderer.addClass(document.body, 'hide-overflow');
  }
  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          '100%';

  }

  onOkClick() {
    this.resultEmit.emit(true); // Отправляем значение true в родительский компонент
  }

  onNoClick() {
    this.resultEmit.emit(false); // Отправляем значение false в родительский компонент
  }

  clickBackgroundNotContent(elem: Event) {
    //закрываем модальное окно при нажатии на фон как будто нажата кнопка "ОК" или "Нет"
    if (elem.target !== elem.currentTarget) return;
    if (this.type === 'Ok') this.resultEmit.emit(true);
    if (this.type === 'yesOrNo') this.resultEmit.emit(false);
  }
}
