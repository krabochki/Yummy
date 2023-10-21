import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ICategory } from 'src/app/modules/recipes/models/categories';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent {
  @Input() categories: ICategory[] = [];


  @ViewChild('list')
  list: ElementRef | null = null;

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
