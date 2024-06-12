import { Component, Input } from '@angular/core';
import { PluralizationService } from 'src/app/modules/controls/services/plural.service';
import { formatNumber } from 'src/tools/common';

@Component({
  selector: 'app-category-list-item',
  templateUrl: './category-list-item.component.html',
  styleUrls: ['./category-list-item.component.scss'],
})
export class CategoryListItemComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() category: any = null;
  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'section' | 'category' = 'category';
  placeholder = 'assets/images/category-placeholder.png';

  get title(): string {
    return this.context === 'section'
      ? `${this.category.name} (в категориях этого раздела ${
          this.category.recipeCount
        } ${this.pluralService.getPluralForm(this.category.recipeCount, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} без повторений)`
      : `${this.category.name} (${
          this.category.recipeCount
        } ${this.pluralService.getPluralForm(this.category.recipeCount, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} в этой категории)`;
  }

  formatNumber(number: number) {
    return formatNumber(number);
  }

  constructor(private pluralService: PluralizationService) {}
}
