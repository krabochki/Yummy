import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { addModalStyle, removeModalStyle } from 'src/tools/common';

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
})
export class ImageViewerComponent implements OnInit, OnDestroy {
  @Output() closeEmitter = new EventEmitter();

  image = '';
  @Input() images: string[] = [];
  @Input() currentImage: number = 0;

  constructor(private renderer: Renderer2) {}

  nextClick() {
    if (this.currentImage !== this.images.length - 1) {
      this.currentImage++;
      this.image = this.images[this.currentImage];
    }
  }
  backClick() {
    if (this.currentImage !== 0) {
      this.currentImage--;
      this.image = this.images[this.currentImage];
    }
  }

  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.startX = event.clientX;
  }

  // Обработка окончания перетаскивания мышью
  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    const endX = event.clientX;
    const deltaX = endX - this.startX;

    if (Math.abs(deltaX) > 50) {
      // Значение порога для определения свайпа
      if (deltaX > 0) {
        this.backClick();
      } else {
        this.nextClick();
      }
    }
  }

  downloadImage() {
        // Открываем контекстное меню для скачивания изображения
        const link = document.createElement('a');
        link.href = this.images[this.currentImage]; // Путь к изображению
        link.download = 'yummy'; // Имя файла для скачивания
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

  }

  onTouchEnd(event: TouchEvent) {
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        this.backClick();
      } else {
        this.nextClick();
      }
    }
  }
  startX = 0;
  startY = 0;

  ngOnInit() {
    this.image = this.images[this.currentImage];

    addModalStyle(this.renderer);
  }
  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }
  ngOnDestroy() {
    removeModalStyle(this.renderer);
  }
}
