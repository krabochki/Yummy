import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ICategory, ISection } from 'src/app/modules/recipes/models/categories';

@Component({
  selector: 'app-category-list',
  templateUrl: './horizontal-category-list.component.html',
  styleUrls: ['./horizontal-category-list.component.scss'],
})
export class HorizontalCategoryListComponent {
  @Input() categories: ICategory[] | ISection[] = [];

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
}
