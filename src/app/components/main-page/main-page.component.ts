import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ICategory } from 'src/app/models/categories';
import { IRecipe } from 'src/app/models/recipes';
import { CategoryService } from 'src/app/services/category.service';
import { RecipeService } from 'src/app/services/recipe.service';


@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent {


  
  allRecipes:IRecipe[]=[]
  allCategories:ICategory[]=[]
  popularRecipes:IRecipe[]=[];
  recentRecipes:IRecipe[]=[];
  recipesSubscription!: Subscription;
  categoriesSubscription!: Subscription;

  constructor(
    private recipeService: RecipeService,private categoryService: CategoryService
 ) {

  }

  

  ngOnInit(): void {
    this.recipesSubscription = this.recipeService
      .getRecipes()
      .subscribe((recipesData) => {
        this.allRecipes = recipesData;

        this.popularRecipes = recipesData.sort((a, b) => b.likesId.length - a.likesId.length);
        this.popularRecipes = this.allRecipes.slice(0, 8);

        this.recentRecipes = recipesData.sort((a, b) => {
          const dateA = new Date(a.publicationDate); // Предполагается, что у вас есть поле "date" в рецептах
          const dateB = new Date(b.publicationDate);
          return dateB.getTime() - dateA.getTime(); // Сортировка по убыванию даты
        });
        
        // Обрежьте массив до последних 8 рецептов
        this.recentRecipes = this.allRecipes.slice(0, 8);

      });

      this.categoriesSubscription = this.categoryService
      .getCategories()
      .subscribe((recipesData) => {
        this.allCategories = recipesData;

     

      });
  }

}
