import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe } from '../../../models/recipes';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';

@Component({
  selector: 'app-some-recipes-page',
  templateUrl: './some-recipes-page.component.html',
  styleUrls: ['./some-recipes-page.component.scss'],
})
export class SomeRecipesPageComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private authService:AuthService
  ) {}

  filter: string = '';
  recipesToShow: IRecipe[] = [];
  allRecipes: IRecipe[] = [];
  get h1(): string {
    if (this.filter === 'popular') {
      return 'Популярные рецепты';
    }
    if (this.filter === 'recent') {
      return 'Недавние рецепты';
    }
       if (this.filter === 'my-recipes') {
         return 'Мои рецепты';
       }
     if (this.filter === 'favorite') {
       return 'Сохраненные рецепты';
     }
    
     if (this.filter === 'all') {
       return 'Все рецепты';
     } else return '';
  }
  currentUser:IUser = nullUser

  ngOnInit(): void {
    
  
    this.route.data.subscribe((data) => {
      this.filter = data['filter'];
      this.authService.getCurrentUser().subscribe(
        (user: IUser) => {
          this.currentUser = user;

        
          this.recipeService.getRecipes().subscribe((data) => {

            if (this.filter === 'popular') {
              this.allRecipes = this.recipeService.getPublicRecipes(data);

              this.allRecipes = this.recipeService.getPopularRecipes(
                this.allRecipes,
              ); // Здесь загруженный массив рецептов
              this.recipesToShow = this.allRecipes.slice(0, 8); // Первые 8 рецептов
            }
            if (this.filter === 'recent') {
              this.allRecipes = this.recipeService.getPublicRecipes(data);

              this.allRecipes = this.recipeService.getRecentRecipes(
                this.allRecipes,
              ); // Здесь загруженный массив рецептов
              this.recipesToShow = this.allRecipes.slice(0, 8); // Первые 8 рецептов
            }
            if (this.filter === 'my-recipes') {
                      this.allRecipes = data;

              this.allRecipes = this.recipeService.getRecipesByUser(
                this.allRecipes,this.currentUser.id
              ); 
              this.recipesToShow = this.allRecipes.slice(0, 8); // Первые 8 рецептов
            }
                if (this.filter === 'favorite') {
                  this.allRecipes = data;

                  this.allRecipes = this.recipeService.getFavoriteRecipesByUser(
                    this.allRecipes,
                    this.currentUser.id,
                  );
                  this.recipesToShow = this.allRecipes.slice(0, 8); // Первые 8 рецептов
                }
            if (this.filter === 'all') {
              this.allRecipes = this.recipeService.getPublicRecipes(data);
              this.recipesToShow = this.recipeService.getPublicRecipes(data);
            }
          });
        
        }
        


        
      )

    
    });
  }

  loadMoreRecipes() {
    const currentLength = this.recipesToShow.length;
    const nextRecipes = this.allRecipes.slice(currentLength, currentLength + 4);
    this.recipesToShow = [...this.recipesToShow, ...nextRecipes];
  }
}
