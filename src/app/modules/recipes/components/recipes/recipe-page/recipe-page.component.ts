import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { Title } from '@angular/platform-browser';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Subscription } from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

@Component({
  selector: 'app-recipe-page',
  templateUrl: './recipe-page.component.html',
  styleUrls: ['./recipe-page.component.scss'],
})
export class RecipePageComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}
  dataLoaded = false;

  recipe: IRecipe = nullRecipe;

  currentUserSubscription?: Subscription;
  currentUser: IUser = nullUser;

  basketMode = false;

  author: IUser = nullUser;
  iHaveIndgredient: boolean[] = [];
  basket: boolean[] = [];

  addToBasket(i: number) {
    this.basket[i] = true;
  }
  removeFromBasket(i: number) {
    this.basket[i] = false;
  }
  ngOnInit() {
    this.router.events.subscribe(() => {
      window.scrollTo(0, 0);
    });

    registerLocaleData(localeRu);

    this.currentUserSubscription = this.authService
      .getCurrentUser()
      .subscribe((data) => {
        this.currentUser = data;

        this.route.data.subscribe((data: Data) => {
          this.recipe = data['RecipeResolver'];
          this.titleService.setTitle(this.recipe.name);

          this.iHaveIndgredient = Array.from(
            { length: this.recipe.ingredients.length },
            () => false,
          );
          this.basket = Array.from(
            { length: this.recipe.ingredients.length },
            () => false,
          );

          this.userService.getUsers().subscribe((data) => {
            const findedUser = data.find(
              (user) => user.id === this.recipe.authorId,
            );
            if (findedUser) {
              this.author = findedUser;
            }

           
          });


           this.recipeService.recipes$.subscribe((recipes) => {
              recipes.forEach((recipe) => {
                if (recipe.id === this.recipe.id) {
                  this.recipe = recipe;
                  if (this.currentUser.id !== 0) {
                    this.isRecipeLiked = this.recipe.likesId.includes(
                      this.currentUser.id,
                    );
                    console.log(this.isRecipeLiked);

                    this.isRecipeCooked = this.recipe.cooksId.includes(
                      this.currentUser.id,
                    );
                    console.log(this.isRecipeCooked);

                    this.isRecipeFavorite = this.recipe.favoritesId.includes(
                      this.currentUser.id,
                    );
                    console.log(this.isRecipeFavorite);
                  }
                }

              });
           });
          
          this.recipeService.getRecipes().subscribe((data) => {
            this.recentRecipes = this.recipeService.getPublicRecipes(data);
            this.recentRecipes = this.recipeService
              .getRecentRecipes(this.recentRecipes)
              .slice(0, 3);
          });
        });
      });
  }

  makeThisRecipeFavorite() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }
    this.isRecipeFavorite = !this.isRecipeFavorite;
    if (this.isRecipeFavorite) {
      this.recipe = this.recipeService.addRecipeToFavorites(
        this.currentUser.id,
        this.recipe,
      );
    } else {
      this.recipe = this.recipeService.removeRecipeFromFavorites(
        this.currentUser.id,
        this.recipe,
      );
    }
    this.recipeService.updateRecipe(this.recipe);
  }

  isRecipeFavorite: boolean = false;
  isRecipeLiked: boolean = false;
  isRecipeCooked: boolean = false;
  noAccessModalShow: boolean = false;

  handleNoAccessModal(result: boolean) {
    if (result) {
      window.scrollTo(0, 0);
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  likeThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    let updatedRecipe: IRecipe;

    this.isRecipeLiked = !this.isRecipeLiked;

    if (this.isRecipeLiked) {
      updatedRecipe = this.recipeService.likeRecipe(
        this.currentUser.id,
        this.recipe,
      );
    } else {
      updatedRecipe = this.recipeService.unlikeRecipe(
        this.currentUser.id,
        this.recipe,
      );
    }
    this.recipeService.updateRecipe(updatedRecipe);
  }
  //готовим рецепт
  cookThisRecipe() {
    if (this.currentUser.id === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeCooked = !this.isRecipeCooked;

    let updatedRecipe: IRecipe;

    if (this.isRecipeCooked) {
      updatedRecipe = this.recipeService.cookRecipe(
        this.currentUser.id,
        this.recipe,
      );
    } else {
      updatedRecipe = this.recipeService.uncookRecipe(
        this.currentUser.id,
        this.recipe,
      );
    }

    this.recipeService.updateRecipe(updatedRecipe);
  }

  recentRecipes: IRecipe[] = [];
}
