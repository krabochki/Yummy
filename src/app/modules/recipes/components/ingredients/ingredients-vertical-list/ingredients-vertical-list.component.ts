import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
} from '@angular/core';
import { nullIngredient } from '../../../models/ingredients';

@Component({
  selector: 'app-ingredients-vertical-list',
  templateUrl: './ingredients-vertical-list.component.html',
  styleUrls: ['./ingredients-vertical-list.component.scss'],
})
export class IngredientsVerticalListComponent implements OnChanges, OnInit {
  @Input() ingredients: any[] = [];
  @Input() context: 'ingredient' | 'group' = 'ingredient';
  @Input() editEmitter = new EventEmitter();
  @Input() preloader: boolean = false;

  ngOnInit() {
    if (this.preloader) {
      const width = window.innerWidth;
      let blocks = 0;
      switch (true) {
        case  width <= 740:
          blocks = 2;
          break;
        case width > 740 && width <= 960:
          blocks = 3;
          break;
        case width > 960 && width <= 1400:
          blocks = 4;
          break;
        case width > 1400:
          blocks = 5;
          break;
      }
      blocks *= 2;
      const loadingCategory = { ...nullIngredient, id: -1 };
      for (let index = 0; index < blocks; index++) {
        this.ingredients.push(loadingCategory);
      }
    }
  }
  ngOnChanges() {
    if (!this.preloader) {
      this.onResize();
    }
  }

  filterNullBlocks() {
    this.ingredients = this.ingredients.filter((block) => block.id !== 0);
  }

  blockScheme(blocksInRow: number) {
    this.filterNullBlocks();
    if (this.ingredients.length % blocksInRow !== 0) {
      while (this.ingredients.length % blocksInRow !== 0) {
        this.ingredients.push(nullIngredient);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const event = window.innerWidth;
    switch (true) {
      case event <= 740:
        this.blockScheme(2);
        break;
      case event > 610 && event <= 960:
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
