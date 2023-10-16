import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent {
  @Input() notMain = true;
  @Input() background = '';
  @Input() label = '';
  @Input() info = '';
  @Input() buttonText = '';
  @Input() link = '';

  get formattedLabel(): string {
    // Разбиваем текст на строки и вставляем <br> между ними
    const lines = this.label.split('\n');
    return lines.join('<br>');
  }
}
