import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe } from '../../../models/recipes';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ICategory, nullCategory } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import { Title } from '@angular/platform-browser';
import { nullRecipe } from '../../../models/recipes';
import { trigger } from '@angular/animations';
import {  heightAnim, onlyHeight } from 'src/tools/animations';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
@Component({
  selector: 'app-some-recipes-page',
  templateUrl: './some-recipes-page.component.html',
  styleUrls: [
    './some-recipes-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  animations: [trigger('auto-complete', heightAnim())],
})
export class SomeRecipesPageComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private userService: UserService,
    private title: Title,
  ) {
    this.myNullRecipe.id = -1;
    this.nullRecipes = [this.myNullRecipe];
  }

  myNullRecipe = JSON.parse(JSON.stringify(nullRecipe));

  nullRecipes: IRecipe[] = [];
  dataLoad: boolean = false;
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

    if (this.filter === 'category-recipes') {
      return this.category.name;
    }

    if (this.filter === 'all') {
      return 'Все рецепты';
    } else return '';
  }

  get noRecipesH1(): string {
    if (this.filter === 'my-recipes') {
      return 'У вас пока нет собственных рецептов. Попробуйте создать парочку рецептов и зайдите сюда снова';
    }
    if (this.filter === 'favorite') {
      return 'У вас пока нет сохраненных рецептов. Попробуйте добавить парочку рецептов в избранное и зайдите сюда снова';
    }

    if (this.filter === 'category-recipes') {
      return 'В этой категории пока нет рецептов. Следите за обновлениями, совсем скоро они появятся!';
    } else return '';
  }

  get noRecipesButtonText(): string {
    if (this.filter === 'my-recipes') {
      return 'Добавить рецепт';
    }
    if (this.filter === 'favorite') {
      return 'Все рецепты';
    }

    if (this.filter === 'category-recipes') {
      return 'Все категории';
    } else return '';
  }

  get noRecipesRouterLink(): string {
    if (this.filter === 'my-recipes') {
      return '/recipes/add';
    }
    if (this.filter === 'favorite') {
      return '/recipes';
    }

    if (this.filter === 'category-recipes') {
      return '/categories';
    } else return '';
  }

  category: ICategory = nullCategory;
  recentRecipes: IRecipe[] = [];
  popularRecipes: IRecipe[] = [];
  myRecipes: IRecipe[] = [];
  followingRecipes: IRecipe[] = [];
  currentUser: IUser = nullUser;
  

  allUsers:IUser[] = []
  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.filter = data['filter'];

    
         

      if (this.filter === 'category-recipes') {
        this.category = data['CategoryResolver'];
        this.recipeService.getRecipes().subscribe((data) => {
          this.allRecipes = this.recipeService.getRecipesByCategory(
            data,
            this.category.id,
          );
          this.recipesToShow = this.allRecipes.slice(0, 8);
          this.title.setTitle(this.h1);
          this.dataLoad = true;
        });
      } else {
        this.authService.getCurrentUser().subscribe((user: IUser) => {
          this.currentUser = user;

          
         this.userService.getUsers().subscribe((data) => {
           this.allUsers = data;
         });
          this.recipeService.getRecipes().subscribe((data) => {
            if (this.filter === 'popular') {
              this.allRecipes = this.recipeService.getPublicRecipes(data);

              this.allRecipes = this.recipeService.getPopularRecipes(
                this.allRecipes,
              );
              this.recipesToShow = this.allRecipes.slice(0, 8); // Первые 8 рецептов
            }
            if (this.filter === 'recent') {
              this.allRecipes = this.recipeService.getPublicRecipes(data);

              this.allRecipes = this.recipeService.getRecentRecipes(
                this.allRecipes,
              );
              this.recipesToShow = this.allRecipes.slice(0, 8); // Первые 8 рецептов
            }
            if (this.filter === 'my-recipes') {
              this.allRecipes = data;

              this.allRecipes = this.recipeService.getRecipesByUser(
                this.allRecipes,
                this.currentUser.id,
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
              this.popularRecipes = this.recipeService
                .getPopularRecipes(this.allRecipes)
                .slice(8);
              this.recentRecipes = this.recipeService
                .getRecentRecipes(this.allRecipes)
                .slice(8);
              this.myRecipes = this.recipeService.getRecipesByUser(
                data,
                this.currentUser.id,
              );
                const currentUserFollowing: IUser[] =
                  this.userService.getFollowing(this.allUsers, this.currentUser.id);
                currentUserFollowing.forEach((element) => {
                  const foundRecipes = this.recipeService.getRecipesByUser(
                    this.recentRecipes,
                    element.id,
                  );
                  this.followingRecipes = [
                    ...this.followingRecipes,
                    ...foundRecipes,
                  ];
                  this.followingRecipes = this.followingRecipes.slice(0, 8);
                });
              
            }

            this.title.setTitle(this.h1);
            this.dataLoad = true;
          });
        });
      }
    });
  }

  loadMoreRecipes() {
    const currentLength = this.recipesToShow.length;
    const nextRecipes = this.allRecipes.slice(currentLength, currentLength + 4);
    this.recipesToShow = [...this.recipesToShow, ...nextRecipes];
  }

  searchQuery: string = '';
  searchOff() {
    this.searchQuery = '';
  }

  autocompleteShow: boolean = false;

  blur() {
      
    setTimeout(() => {
    this.autocompleteShow = false;
      
    }, 300);
  }
  autocomplete: IRecipe[] = [];
  getUser(userId: number): IUser {
    
    const finded = this.allUsers.find((user) => user.id === userId);
    if (finded) return finded;
    return nullUser;
  }

  focus() {

    
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }
  search() {
    this.autocompleteShow = true;
    if (this.searchQuery && this.searchQuery!==''  ) {
          this.autocomplete = [];

      const filterRecipes: IRecipe[] = this.allRecipes.filter((recipe: IRecipe) =>
        recipe.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
      filterRecipes.forEach((element) => {
        this.autocomplete.push(element);
      });
      
    } 
    else this.blur()
  }
}

