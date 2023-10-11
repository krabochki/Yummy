import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ICategory } from 'src/app/modules/recipes/models/categories';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent {
  @Input() categories?: ICategory[] = [];
}
