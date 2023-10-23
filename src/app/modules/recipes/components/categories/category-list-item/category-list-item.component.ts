import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

import { RecipeService } from '../../../services/recipe.service';

@Component({
  selector: 'app-category-list-item',
  templateUrl: './category-list-item.component.html',
  styleUrls: ['./category-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListItemComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() category: any = null;

  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'section' | 'category' = 'category';

  recipesNumber = 0;
  constructor(private recipeService: RecipeService) {}
  ngOnInit() {
    if (this.showRecipesNumber)
      this.recipeService.recipes$.subscribe((data) => {
        if (this.context === 'category')
          this.recipesNumber = this.recipeService.getRecipesByCategory(
            data,
            this.category.id,
          ).length;
        else {
          this.category.categoriesId.forEach((element: number) => {
            this.recipesNumber += this.recipeService.getRecipesByCategory(
              data,
              element,
            ).length;
          });
        }
      });
  }
}
