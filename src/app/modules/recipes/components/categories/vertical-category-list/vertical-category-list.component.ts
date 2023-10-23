import { ChangeDetectionStrategy, Component, HostListener, Input, OnChanges } from '@angular/core';
import { ICategory, nullCategory } from '../../../models/categories';

@Component({
  selector: 'app-vertical-category-list',
  templateUrl: './vertical-category-list.component.html',
  styleUrls: ['./vertical-category-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalCategoryListComponent implements OnChanges {
  @Input() categories: ICategory[] = [];
  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'category' | 'section' = 'category';
  @Input() moderMode = false;

  ngOnChanges() {
    this.onResize();
  }

  filterNullBlocks() {
    this.categories = this.categories.filter((block) => block.id !== 0);
  }

  blockScheme(blocksInRow: number) {
    this.filterNullBlocks();
    if (this.categories.length % blocksInRow !== 0) {
      while (this.categories.length % blocksInRow !== 0) {
        this.categories.push(nullCategory);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const event = window.innerWidth;
    switch (true) {
      case event < 480:
        this.filterNullBlocks();
        while (this.categories.length !== 3) this.categories.push(nullCategory);
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
