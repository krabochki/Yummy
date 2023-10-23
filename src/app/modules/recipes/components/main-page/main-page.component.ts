import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, map } from 'rxjs';
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
export class MainPageComponent implements OnInit, OnDestroy {
  allRecipes: IRecipe[] = [];
  allSections: ICategory[] = [];
  popularRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];
  recipesSubscription!: Subscription;
  categoriesSubscription!: Subscription;

  currentUserSubscription?: Subscription;
  currentUser: IUser = {...nullUser};

  constructor(
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private titleService: Title,
    private authService: AuthService,
  ) {
    this.titleService.setTitle('Yummy');
  }

  userRecipes:IRecipe [] =[]
  ngOnInit(): void {
    this.currentUserSubscription = this.authService.currentUser$.subscribe(
      (currentUser) => {
        this.currentUser = currentUser;
        if (currentUser.id !== 0) {
          this.userRecipes = this.recipeService
            .getRecipesByUser(this.allRecipes, currentUser.id)
            .slice(0, 8);
        }
      },
    );
    this.recipesSubscription = this.recipeService.recipes$.subscribe(
      (recipes) => {
        this.allRecipes = this.recipeService.getPublicRecipes(recipes);
        this.popularRecipes = this.recipeService
          .getPopularRecipes(this.allRecipes)
          .slice(0, 8);
        this.recentRecipes = this.recipeService
          .getRecentRecipes(this.allRecipes)
          .slice(0, 8);

        this.categoriesSubscription = this.categoryService
          .sections$
          .subscribe((data) => {
            this.allSections = data;
          });
      },
    );
  }

  ngOnDestroy() {
    this.currentUserSubscription?.unsubscribe();
    this.recipesSubscription.unsubscribe();
  }
}
