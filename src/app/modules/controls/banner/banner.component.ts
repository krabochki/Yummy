import { trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { modal } from 'src/tools/animations';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal',modal())]
})
export class BannerComponent {
  @Input() notMain = true;
  @Input() background = '';
  @Input() label = '';
  @Input() info = '';
  @Input() buttonText = '';
  @Input() link = '';
  @Output() clickButton = new EventEmitter<boolean>()


  creatingMode = false;

  get formattedLabel(): string {
    // Разбиваем текст на строки и вставляем <br> между ними
    const lines = this.label.split('\n');
    return lines.join('<br>');
  }
}
