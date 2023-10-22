import { Component, Input, OnInit } from '@angular/core';
import {
  ICategory,
  ISection,
  nullCategory,
  nullSection,
} from 'src/app/modules/recipes/models/categories';
import { RecipeService } from '../../../services/recipe.service';

@Component({
  selector: 'app-category-list-item',
  templateUrl: './category-list-item.component.html',
  styleUrls: ['./category-list-item.component.scss'],
})
export class CategoryListItemComponent implements OnInit {
  @Input() category: any = null;

  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'section' |'category' = 'category';

  recipesNumber = 0;
  constructor(private recipeService: RecipeService) {}
  ngOnInit() {
    if (this.showRecipesNumber)
      this.recipeService.getRecipes().subscribe((data) => {
        if(this.context === 'category')
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
