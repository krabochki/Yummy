import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ICategory } from 'src/app/modules/recipes/models/categories';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit {
  allRecipes: IRecipe[] = [];
  allCategories: ICategory[] = [];
  popularRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];
  recipesSubscription!: Subscription;
  categoriesSubscription!: Subscription;

  currentUserSubscription?: Subscription;
  currentUser: IUser = nullUser;




  constructor(
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private titleService: Title,
    private authService:AuthService
  ) {
    this.titleService.setTitle('Yummy');
  }

  ngOnInit(): void {
    this.recipesSubscription = this.recipeService
      .getRecipes()
      .subscribe((recipesData) => {
        this.allRecipes = recipesData;

        console.log(recipesData);

        this.popularRecipes = this.recipeService
          .getPopularRecipes(recipesData)
          .slice(0, 10);

        this.recentRecipes = this.recipeService
          .getRecentRecipes(recipesData)
          .slice(0, 10);

        this.categoriesSubscription = this.categoryService
          .getCategories()
          .subscribe((recipesData) => {
            this.allCategories = recipesData;
          });
      });
  
   this.currentUserSubscription = this.authService
     .getCurrentUser()
     .subscribe((data) => {
       this.currentUser = data;
     });
  }
}
