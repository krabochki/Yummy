import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { ICategory } from 'src/app/modules/recipes/models/categories';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
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
    private titleService: Title
  ) {
    this.titleService.setTitle('Yummy')
   }

  ngOnInit(): void {
    this.recipesSubscription = this.recipeService
      .getRecipes()
      .subscribe((recipesData) => {
        this.allRecipes = recipesData;

        console.log(recipesData)


        this.popularRecipes = this.recipeService.getPopularRecipes(recipesData).slice(0, 4);

        this.recentRecipes = this.recipeService.getRecentRecipes(recipesData).slice(0, 6);

        this.categoriesSubscription = this.categoryService
          .getCategories()
          .subscribe((recipesData) => {
            this.allCategories = recipesData;
          });
    
      
      })
  }

}
