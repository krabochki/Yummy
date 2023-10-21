import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ICategory, ISection, nullCategory } from 'src/app/modules/recipes/models/categories';

@Component({
  selector: 'app-category-list-item',
  templateUrl: './category-list-item.component.html',
  styleUrls: ['./category-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListItemComponent {
  @Input() category: ICategory | ISection = nullCategory;
}
