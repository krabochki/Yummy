import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
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

  zoomLevel: number = 1; // начальный масштаб

  zoomIn() {
    this.zoomLevel += 0.1; // увеличиваем масштаб на 10%
    // обновляем стили для масштабирования изображения
  }

  imageObject: Array<object> = [
    {
      image: 'assets/img/slider/1.jpg',
      thumbImage: 'assets/img/slider/1_min.jpeg',
      alt: 'alt of image',
      title: 'title of image',
    },
    {
      image: '.../iOe/xHHf4nf8AE75h3j1x64ZmZ//Z==', // Support base64 image
      thumbImage: '.../iOe/xHHf4nf8AE75h3j1x64ZmZ//Z==', // Support base64 image
      title: 'Image title', //Optional: You can use this key if want to show image with title
      alt: 'Image alt', //Optional: You can use this key if want to show image with alt
      order: 1, //Optional: if you pass this key then slider images will be arrange according @input: slideOrderType
    },
  ];

  constructor(private renderer: Renderer2) {}

  nextClick() {
    if (this.currentImage !== 2) {
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

  ngOnInit() {
    console.log(this.currentImage);
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
