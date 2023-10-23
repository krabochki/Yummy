import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, map } from 'rxjs';
import { ICategory } from 'src/app/modules/recipes/models/categories';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPageComponent implements OnInit, OnDestroy {
  allRecipes: IRecipe[] = [];
  allSections: ICategory[] = [];
  popularRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];
  recipesSubscription!: Subscription;
  categoriesSubscription!: Subscription;

  currentUserSubscription?: Subscription;
  currentUser: IUser = { ...nullUser };
  popularRecipesLoaded = false; 
  userRecipes: IRecipe[] = [];

  constructor(
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private titleService: Title,
    private authService: AuthService,
  ) {
    this.titleService.setTitle('Yummy');
  }

  ngOnInit(): void {
    this.currentUserSubscription = this.authService.currentUser$.subscribe(
      (currentUser) => {
        this.currentUser = currentUser;
         
        if (this.currentUser.id !== 0) {
          this.userRecipes = this.recipeService
            .getRecipesByUser(this.allRecipes, this.currentUser.id)
            .slice(0, 8);
        }
      },
    );
    this.recipesSubscription = this.recipeService.recipes$.subscribe(
      (recipes) => {
        
        this.allRecipes = recipes;
        const publicRecipes = this.recipeService.getPublicRecipes(
          this.allRecipes,
        );

         this.currentUserSubscription = this.authService.currentUser$.subscribe(
           (currentUser) => {
             this.currentUser = currentUser;
           },
         );
        
        if (this.currentUser.id !== 0) {
          this.userRecipes = this.recipeService
            .getRecipesByUser(this.allRecipes,this.currentUser.id)
            .slice(0, 8);
        }
        if (!this.popularRecipesLoaded && this.allRecipes.length>0) {
          this.popularRecipes = this.recipeService
            .getPopularRecipes(publicRecipes)
            .slice(0, 8);
          this.popularRecipesLoaded = true;
        }
        this.recentRecipes = this.recipeService
          .getRecentRecipes(publicRecipes)
          .slice(0, 8);

        this.categoriesSubscription = this.categoryService.sections$.subscribe(
          (data) => {
            this.allSections = data;
          },
        );
      },
    );
  }

  ngOnDestroy() {
    this.currentUserSubscription?.unsubscribe();
    this.recipesSubscription.unsubscribe();
  }
}
