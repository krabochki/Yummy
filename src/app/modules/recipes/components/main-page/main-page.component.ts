import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { ICategory } from 'src/app/modules/recipes/models/categories';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  allRecipes: IRecipe[] = [];
  allCategories: ICategory[] = [];
  popularRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];
  recipesSubscription!: Subscription;
  categoriesSubscription!: Subscription;

  constructor(
    private recipeService: RecipeService,
    private categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    this.recipesSubscription = this.recipeService
      .getRecipes()
      .subscribe((recipesData) => {
        this.allRecipes = recipesData;

        this.popularRecipes = recipesData
          .toSorted((a, b) => b.likesId.length - a.likesId.length)
          .slice(0, 8);

        this.recentRecipes = recipesData
          .toSorted(
            (a, b) =>
              new Date(b.publicationDate).getTime() -
              new Date(a.publicationDate).getTime(),
          )
          .slice(0, 5);
      });

    this.categoriesSubscription = this.categoryService
      .getCategories()
      .subscribe((recipesData) => {
        this.allCategories = recipesData;
      });
  }
}
