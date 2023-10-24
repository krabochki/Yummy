import {
  Component,
  HostListener,
  Input,
  OnChanges
} from '@angular/core';
import { ICategory, nullCategory } from '../../../models/categories';

@Component({
  selector: 'app-vertical-category-list',
  templateUrl: './vertical-category-list.component.html',
  styleUrls: ['./vertical-category-list.component.scss'],
})
export class VerticalCategoryListComponent implements OnChanges {
  @Input() categories: ICategory[] = [];
  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'category' | 'section' = 'category';

  nullCategory: ICategory = nullCategory;

  @Input() moderMode = false;
  ngOnChanges() {
    this.onResize();
  }

  filter() {
    this.categories = this.categories.filter((block) => block.id !== 0);
  }
  blockScheme(blocksInRow: number) {
    this.filter();
    if (this.categories.length % blocksInRow !== 0) {
      while (this.categories.length % blocksInRow !== 0) {
        this.categories.push(nullCategory);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const event = window.innerWidth;

    if (event < 480) {
      this.filter();
      if (this.categories.length < 3) {
        while (this.categories.length !== 3) this.categories.push(nullCategory);
      }
      return;
    } else if (event > 480 && event <= 610) {
      this.blockScheme(2);
    } else if (event > 610 && event <= 960) {
      this.blockScheme(3);
      return;
    } else if (event > 960 && event <= 1400) {
      this.blockScheme(4);
      return;
    } else if (event > 1400) {
      this.blockScheme(5);
      return;
    }
  }
}
