import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { nullIngredient } from '../../../models/ingredients';
import { DragScrollComponent } from 'ngx-drag-scroll';
import { dragStart, dragEnd } from 'src/tools/common';

@Component({
  selector: 'app-ingredients-horizontal-list',
  templateUrl: './ingredients-horizontal-list.component.html',
  styleUrls: ['./ingredients-horizontal-list.component.scss'],
})
export class IngredientsHorizontalListComponent implements OnChanges, OnInit {
  @Input() ingredients: any[] = [];
  @Input() context: 'ingredient' | 'group' = 'ingredient';
  @Output() editEmitter = new EventEmitter();
  @Input() preloader: boolean = false;

  @ViewChild('list') list: ElementRef | null = null;
  disableDrag = false;
  showScrollButtons = true;

  filterNullBlocks() {
    this.ingredients = this.ingredients.filter((block) => block.id !== 0);
  }

  @ViewChild('nav', { read: DragScrollComponent }) ds?: DragScrollComponent;

  ngOnInit() {
    
    if (this.preloader) {
      const width = window.innerWidth;
      let blocks = 0;
      switch (true) {
        case width < 480:
          blocks = 3;
          break;
        case width > 480 && width <= 700:
          blocks = 2;
          break;
        case width > 700 && width <= 960:
          blocks = 3;
          break;
        case width > 960 && width <= 1400:
          blocks = 4;
          break;
        case width > 1400:
          blocks = 5;
          break;
      }
      const loadingCategory = { ...nullIngredient, id: -1 };
      for (let index = 0; index < blocks; index++) {
        this.ingredients.push(loadingCategory);
      }
    }
  }

  ngOnChanges() {
     if (!this.preloader) {
       this.onResize();
     } else {
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

  blockScheme(blocksInRow: number) {
    if (window.innerWidth > 1400 && this.ingredients.length < 6) {
      this.showScrollButtons = false;
    }
    switch (true) {
      case window.innerWidth > 1400 && this.ingredients.length < 6:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 960 &&
        window.innerWidth <= 1400 &&
        this.ingredients.length < 5:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 700 &&
        window.innerWidth <= 960 &&
        this.ingredients.length < 4:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 480 &&
        window.innerWidth <= 700 &&
        this.ingredients.length < 3:
        this.showScrollButtons = false;
        break;
      default:
        this.showScrollButtons = true;
    }

    this.filterNullBlocks();
    if (this.ingredients.length < blocksInRow) {
      while (this.ingredients.length < blocksInRow) {
        this.ingredients.push(nullIngredient);
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
        if (this.ingredients.length <= 2)
          while (this.ingredients.length !== 3)
            this.ingredients.push(nullIngredient);
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
