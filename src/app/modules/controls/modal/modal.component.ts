import { ChangeDetectionStrategy, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { ThemeService, themeUI } from '../../common-pages/services/theme.service';

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
  @Input() buttonsText: string[] = ['Да', 'Нет'];
  @Input() style: 'prim' | 'sec' | 'await' | 'vote' = 'prim';

  @Output() resultEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() closeEmit: EventEmitter<boolean> = new EventEmitter<boolean>();

  get loading() {
    return this.style==='await'
  }

  theme: themeUI = 'light';
  constructor(private renderer: Renderer2,
  private themeService:ThemeService
  ) { }

  ngOnInit(): void {
    this.themeService.theme$.subscribe(
      (theme) => {
        this.theme = theme;
      }
    )
    addModalStyle(this.renderer);
  }
  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
  }

  onOkClick() {
    this.resultEmit.emit(true); 
  }

  onNoClick() {
    this.resultEmit.emit(false); 
  }

  clickBackgroundNotContent(elem: Event) {
    //закрываем модальное окно при нажатии на фон как будто нажата кнопка "ОК" или "Нет"
    if (elem.target !== elem.currentTarget) return;
    if (this.style === 'vote') {
      this.closeEmit.emit(true);
      return;
    }
    if (this.type === 'Ok') this.resultEmit.emit(true);
      if (this.type === 'yesOrNo') this.resultEmit.emit(false);
  }
}
