import { Component, Input } from '@angular/core';
import { ICategory } from 'src/app/models/categories';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent {
  @Input() categories?:ICategory[] =[]  ;
  

}
