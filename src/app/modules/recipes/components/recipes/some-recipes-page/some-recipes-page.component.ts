import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe } from '../../../models/recipes';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ICategory, nullCategory } from '../../../models/categories';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

enum RecipeType {
  Recent = 'recent',
  Popular = 'popular',
  My = 'my-recipes',
  Favorite = 'favorite',
  Category = 'category-recipes',
  All = 'all',
}

const recipeTitles = {
  [RecipeType.Recent]: 'Недавние рецепты',
  [RecipeType.Popular]: 'Популярные рецепты',
  [RecipeType.My]: 'Мои рецепты',
  [RecipeType.Favorite]: 'Сохраненные рецепты',
  [RecipeType.Category]: '',
  [RecipeType.All]: 'Все рецепты',
};

const recipeNoRecipesRouterLinkText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]: '/recipes/add',
  [RecipeType.Favorite]: '/recipes',
  [RecipeType.Category]: '/categories',
  [RecipeType.All]: '',
};

const recipeNoRecipesButtonText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]: 'Добавить рецепт',
  [RecipeType.Favorite]: 'Все рецепты',
  [RecipeType.Category]: 'Все категории',
  [RecipeType.All]: '',
};


const recipeNoRecipesText = {
  [RecipeType.Recent]: '',
  [RecipeType.Popular]: '',
  [RecipeType.My]:
    'У вас пока нет собственных рецептов. Попробуйте создать парочку рецептов и зайдите сюда снова',
  [RecipeType.Favorite]:
    'У вас пока нет сохраненных рецептов. Попробуйте добавить парочку рецептов в избранное и зайдите сюда снова',
  [RecipeType.Category]:
    'В этой категории пока нет рецептов. Следите за обновлениями, совсем скоро они появятся!',
  [RecipeType.All]: '',
};

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
    private userService: UserService,
    private title: Title,
  ) {
  }

  dataLoad: boolean = false;
  filter: string = '';
  recipesToShow: IRecipe[] = [];
  allRecipes: IRecipe[] = [];
  category: ICategory = nullCategory;
  recentRecipes: IRecipe[] = [];
  popularRecipes: IRecipe[] = [];
  myRecipes: IRecipe[] = [];
  followingRecipes: IRecipe[] = [];
  currentUser: IUser = { ...nullUser };
  searchQuery: string = '';
  autocompleteShow: boolean = false;
  autocomplete: IRecipe[] = [];
  allUsers: IUser[] = [];
  currentUserFollowing: IUser[] = [];
  recipeType: RecipeType = RecipeType.All;

  getTitleByRecipeType(recipeType: RecipeType): string {
    if (recipeType === RecipeType.Category) {
      return this.category.name;
    }
    return recipeTitles[recipeType] || '';
  }
  getNoRecipesTextByRecipetype(recipeType: RecipeType): string {
    return recipeNoRecipesText[recipeType] || '';
  }
  getNoRecipesButtonTextByRecipetype(recipeType: RecipeType): string {
    return recipeNoRecipesButtonText[recipeType] || '';
  }
  getNoRecipesRouterLinkTextByRecipetype(recipeType: RecipeType): string {
    return recipeNoRecipesRouterLinkText[recipeType] || '';
  }

  ngOnInit(): void {
    console.log(true)
    this.route.data.subscribe((data) => {
      this.filter = data['filter'];
      switch (this.filter) {
        case 'recent':
          this.recipeType = RecipeType.Recent;
          break;
        case 'all':
          this.recipeType = RecipeType.All;
          break;
        case 'my-recipes':
          this.recipeType = RecipeType.My;
          break;
        case 'favorite':
          this.recipeType = RecipeType.Favorite;
          break;
        case 'popular':
          this.recipeType = RecipeType.Popular;
          break;
        case 'category-recipes':
          this.recipeType = RecipeType.Category;
          break;
      }

      if (this.recipeType === RecipeType.Category) {
        this.category = data['CategoryResolver'];
        this.recipeService.recipes$.subscribe((data) => {
          const publicRecipes = this.recipeService.getPublicRecipes(data);
          this.allRecipes = this.recipeService.getRecipesByCategory(
            publicRecipes,
            this.category.id,
          );
          this.recipesToShow = this.allRecipes.slice(0, 8);
        });
      } else {
        this.authService.currentUser$.subscribe((user: IUser) => {
          this.currentUser = user;
          this.userService.users$.subscribe((data) => {
            this.allUsers = data;
          });
          this.recipeService.recipes$.subscribe((data) => {
            const publicRecipes = this.recipeService.getPublicRecipes(data);
            switch (this.recipeType) {
              case RecipeType.Popular:
                this.allRecipes =
                  this.recipeService.getPopularRecipes(publicRecipes);
                this.recipesToShow = this.allRecipes.slice(0, 8);
                break;
              case RecipeType.Recent:
                this.allRecipes =
                  this.recipeService.getRecentRecipes(publicRecipes);
                this.recipesToShow = this.allRecipes.slice(0, 8);
                break;
              case RecipeType.My:
                this.allRecipes = this.recipeService.getRecipesByUser(
                  data,
                  this.currentUser.id,
                );
                this.recipesToShow = this.allRecipes.slice(0, 8);
                break;
              case RecipeType.Favorite:
                this.allRecipes = this.recipeService.getFavoriteRecipesByUser(
                  data,
                  this.currentUser.id,
                );
                this.recipesToShow = this.allRecipes.slice(0, 8);
                break;
              case RecipeType.All:
                this.allRecipes = publicRecipes;
                this.recipesToShow = publicRecipes;
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
                this.currentUserFollowing = this.userService.getFollowing(
                  this.allUsers,
                  this.currentUser.id,
                );
                this.currentUserFollowing.forEach((following) => {
                  this.followingRecipes=[]
                  const foundRecipes = this.recipeService.getRecipesByUser(
                    this.recentRecipes,
                    following.id,
                  );
                  this.followingRecipes = [
                    ...this.followingRecipes,
                    ...foundRecipes,
                  ];
                  this.followingRecipes = this.followingRecipes.slice(0, 8);
                });
                break;
            }
          });
        });
      }
      this.dataLoad = true;
    });
    this.title.setTitle(this.getTitleByRecipeType(this.recipeType));
  }

  loadMoreRecipes() {
    const currentLength = this.recipesToShow.length;
    const nextRecipes = this.allRecipes.slice(currentLength, currentLength + 4);
    this.recipesToShow = [...this.recipesToShow, ...nextRecipes];
  }

  searchOff() {
    this.searchQuery = '';
  }

  blur() {
    setTimeout(() => {
      this.autocompleteShow = false;
    }, 300);
  }
  getUser(userId: number): IUser {
    const finded = this.allUsers.find((user) => user.id === userId);
    if (finded) return finded;
    return { ...nullUser };
  }

  focus() {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }
  search() {
    this.autocompleteShow = true;
    if (this.searchQuery && this.searchQuery !== '') {
      this.autocomplete = [];

      const filterRecipes: IRecipe[] = this.allRecipes.filter(
        (recipe: IRecipe) =>
          recipe.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
      filterRecipes.forEach((element) => {
        this.autocomplete.push(element);
      });
    } else this.blur();
  }
}
