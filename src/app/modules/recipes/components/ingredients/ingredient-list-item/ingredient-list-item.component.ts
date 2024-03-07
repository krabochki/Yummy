import {
  Component,
  Input,
} from '@angular/core';
import { PluralizationService } from 'src/app/modules/controls/directives/plural.service';

@Component({
  selector: 'app-ingredient-list-item',
  templateUrl: './ingredient-list-item.component.html',
  styleUrls: ['./ingredient-list-item.component.scss'],
})
export class IngredientListItemComponent {
  @Input() ingredient: any = null;
  @Input() context: 'ingredient' | 'group' = 'ingredient';
  placeholder = '/assets/images/ingredient-placeholder.png';

  constructor(private pluralService: PluralizationService) {}

  get title(): string {
    return this.context === 'group'
      ? `${this.ingredient.name} (в ингредиентах этой группы ${
          this.ingredient.recipesCount
        } ${this.pluralService.getPluralForm(this.ingredient.recipesCount, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} без повторений)`
      : `${this.ingredient.name} (${
          this.ingredient.recipesCount
        } ${this.pluralService.getPluralForm(this.ingredient.recipesCount, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} с этим ингредиентом)`;
  }

  get link() {
    const id = this.ingredient.id;
    return this.context === 'group'
      ? `/groups/list/${id}`
      : `/ingredients/list/${id}`;
  }
}
