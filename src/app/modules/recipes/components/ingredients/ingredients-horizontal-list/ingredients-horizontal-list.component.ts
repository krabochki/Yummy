import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IIngredient, nullIngredient } from '../../../models/ingredients';
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

  @ViewChild('list') list: ElementRef | null = null;
  disableDrag = false;
  showScrollButtons = true;

  filterNullBlocks() {
    this.ingredients = this.ingredients.filter((block) => block.id !== 0);
  }

  @ViewChild('nav', { read: DragScrollComponent }) ds?: DragScrollComponent;

  ngOnInit() {
    this.onResize();
  }

  ngOnChanges() {
    this.onResize();
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
