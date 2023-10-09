import { Component, Input } from '@angular/core';
import { ICategory } from 'src/app/models/categories';

@Component({
  selector: 'app-category-list-item',
  templateUrl: './category-list-item.component.html',
  styleUrls: ['./category-list-item.component.scss']
})
export class CategoryListItemComponent {
  @Input() category?:ICategory  ;

}
