import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { DragScrollComponent } from 'ngx-drag-scroll';
import { nullCategory, nullSection } from 'src/app/modules/recipes/models/categories';
import { dragEnd, dragStart } from 'src/tools/common';

@Component({
  selector: 'app-horizontal-category-list',
  templateUrl: './horizontal-category-list.component.html',
  styleUrls: ['./horizontal-category-list.component.scss']
})
export class HorizontalCategoryListComponent implements OnChanges, OnInit {
  @Input() categories: any[] = [];
  @Input() showRecipesNumber: boolean = false;
  @Input() preloader: boolean = false;

  @ViewChild('list')
  list: ElementRef | null = null;
  @Input() context: 'category' | 'section' = 'category';

  showScrollButtons = true;
  constructor(private cd:ChangeDetectorRef){}

  filterNullBlocks() {
    this.categories = this.categories.filter((block) => block.id !== 0);
  }

  disableDrag = false;
  @ViewChild('nav', { read: DragScrollComponent }) ds?: DragScrollComponent;


  ngOnInit() {

    if (this.preloader) {
        const width = window.innerWidth;
        let blocks = 0;
        switch (true) {
          case width < 480:
            blocks = 3;
            break;
          case width > 480 && width <= 610:
            blocks = 2;
            break;
          case width > 610 && width <= 960:
            blocks = 3;
            break;
          case width > 960 && width <= 1400:
            blocks = 4;
            break;
          case width > 1400:
            blocks = 5;
            break;
        }
        const loadingCategory = { ...nullCategory, id: -1 };
        for (let index = 0; index < blocks; index++) {
          this.categories.push(loadingCategory);
        }
      }

  }

  ngOnChanges() {
    if (!this.preloader) {
      this.onResize();
    }
    else {
      this.showScrollButtons = false;
    }
  }

  dragStart(): void {
    if (this.showScrollButtons) dragStart();
  }

  dragEnd(): void {
    if (this.showScrollButtons) dragEnd();
  }

  scrollLeft() {
    this.ds?.moveLeft();
  }

  scrollRight() {
    this.ds?.moveRight();
  }

  //фиктивные блоки для случая если их меньше чем длина блоков в строке(чтобы не было пустого пространства) и проверка нужны для кнопки скролла
  blockScheme(blocksInRow: number) {
    if (window.innerWidth > 1400 && this.categories.length < 6) {
      this.showScrollButtons = false;
    }
    switch (true) {
      case window.innerWidth > 1400 && this.categories.length < 6:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 960 &&
        window.innerWidth <= 1400 &&
        this.categories.length < 5:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 700 &&
        window.innerWidth <= 960 &&
        this.categories.length < 4:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 480 &&
        window.innerWidth <= 700 &&
        this.categories.length < 3:
        this.showScrollButtons = false;
        break;
      default:
        this.showScrollButtons = true;
    }

    this.filterNullBlocks();
    if (this.categories.length < blocksInRow) {
      while (this.categories.length < blocksInRow) {
        this.categories.push(nullSection);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.disableDrag = window.innerWidth < 480;

    const event = window.innerWidth;
    switch (true) {
      case event < 480:
        this.filterNullBlocks();
        if (this.categories.length <= 2)
          while (this.categories.length !== 3)
            this.categories.push(nullSection);
        break;
      case event > 480 && event <= 700:
        this.blockScheme(2);
        break;
      case event > 700 && event <= 960:
        this.blockScheme(3);
        break;
      case event > 960 && event <= 1400:
        this.blockScheme(4);
        break;
      case event > 1400:
        this.blockScheme(5);
        break;
    }
  }
}
