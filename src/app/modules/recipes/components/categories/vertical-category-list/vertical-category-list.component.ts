import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ICategory, nullCategory } from '../../../models/categories';

@Component({
  selector: 'app-vertical-category-list',
  templateUrl: './vertical-category-list.component.html',
  styleUrls: ['./vertical-category-list.component.scss'],
})
export class VerticalCategoryListComponent implements OnChanges, OnInit {
  @Input() categories: ICategory[] = [];
  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'category' | 'section' = 'category';
  @Input() moderMode = false;
  @Output() editEmitter = new EventEmitter();

  @Input() preloader: boolean = false;

  ngOnChanges() {
    this.onResize();
  }

  ngOnInit() {


    if (this.preloader) {
      const width = window.innerWidth;
      let blocks = 0;
        switch (true) {
          case  width <= 700:
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
      blocks *= 2;
      const loadingCategory = { ...nullCategory, id: -1 };
      for (let index = 0; index < blocks; index++) {
        this.categories.push(loadingCategory)
        
      }
      
    }
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
      case  event <= 700:
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
