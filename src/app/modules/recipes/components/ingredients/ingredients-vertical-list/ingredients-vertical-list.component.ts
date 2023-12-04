import { Component, EventEmitter, HostListener, Input, OnChanges } from '@angular/core';
import { nullIngredient } from '../../../models/ingredients';

@Component({
  selector: 'app-ingredients-vertical-list',
  templateUrl: './ingredients-vertical-list.component.html',
  styleUrls: ['./ingredients-vertical-list.component.scss'],
})
export class IngredientsVerticalListComponent implements OnChanges {
  @Input() ingredients: any[] = [];
  @Input() context: 'ingredient' | 'group' = 'ingredient';
  @Input() editEmitter = new EventEmitter();

  ngOnChanges() {
    this.onResize();
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
      case event < 480:
        this.filterNullBlocks();
        if (this.ingredients.length <= 2)
          while (this.ingredients.length !== 3)
            this.ingredients.push(nullIngredient);
        break;
      case event > 480 && event <= 610:
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
