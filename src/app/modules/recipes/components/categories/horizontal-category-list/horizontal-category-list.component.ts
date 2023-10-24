import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnChanges, ViewChild } from '@angular/core';
import { ICategory, ISection, nullCategory, nullSection } from 'src/app/modules/recipes/models/categories';

@Component({
  selector: 'app-horizontal-category-list',
  templateUrl: './horizontal-category-list.component.html',
  styleUrls: ['./horizontal-category-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorizontalCategoryListComponent implements OnChanges {
  @Input() categories: ICategory[] | ISection[] = [];
  @Input() showRecipesNumber: boolean = false;

  @ViewChild('list')
  list: ElementRef | null = null;
  @Input() context: 'category' | 'section' = 'category';

  scrollLeft() {
    if (this.list)
      this.list.nativeElement.scrollLeft -=
        this.list.nativeElement.scrollWidth / this.categories.length;
  }

  scrollRight() {
    if (this.list)
      this.list.nativeElement.scrollLeft +=
        this.list.nativeElement.scrollWidth / this.categories.length;
  }

  showScrollButtons = true;
  ngOnChanges() {
    this.onResize();
  }

  filterNullBlocks() {
    this.categories = this.categories.filter((block) => block.id !== 0);
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
      case window.innerWidth > 610 &&
        window.innerWidth <= 960 &&
        this.categories.length < 4:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 480 &&
        window.innerWidth <= 610 &&
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
    const event = window.innerWidth;
    switch (true) {
      case event < 480:
        this.filterNullBlocks();
        if (this.categories.length <= 2)
          while (this.categories.length !== 3)
            this.categories.push(nullSection);
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
