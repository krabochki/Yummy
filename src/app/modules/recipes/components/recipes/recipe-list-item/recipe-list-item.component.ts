import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recipe-list-item',
  templateUrl: './recipe-list-item.component.html',
  styleUrls: ['./recipe-list-item.component.scss'],
  animations: [trigger('modal', modal())],
})
export class RecipeListItemComponent implements OnInit {
  @Input() recipe: IRecipe = nullRecipe;
  @Input() context: string = '';

  likes: number = 0;
  cooks: number = 0;

  isRecipeFavorite: boolean = false;
  isRecipeLiked: boolean = false;
  isRecipeCooked: boolean = false;

  dataLoaded = false;

  currentUserId = 0;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((currentUser) => {
      this.currentUserId = currentUser.id;

      if (currentUser.role !== 'user') {
        this.moderMode = true;
      }

      this.recipeService.recipes$.subscribe((recipes) => {
        recipes.forEach((element) => {
          if (element.id === this.recipe.id) {
            this.recipe = element;

            if (this.currentUserId !== 0) {
              this.isRecipeLiked = this.recipe.likesId.includes(
                this.currentUserId,
              );
              this.isRecipeCooked = this.recipe.cooksId.includes(
                this.currentUserId,
              );
              this.isRecipeFavorite = this.recipe.favoritesId.includes(
                this.currentUserId,
              );
            }
          }

          this.dataLoaded = true;
        });
        //
      });
    });
  }

  //добавляем рецепт в избранное
  makeThisRecipeFavorite() {
    if (this.currentUserId === 0) {
      this.noAccessModalShow = true;
      return;
    }
    this.isRecipeFavorite = !this.isRecipeFavorite;
    if (this.isRecipeFavorite) {
      this.recipe = this.recipeService.addRecipeToFavorites(
        this.currentUserId,
        this.recipe,
      );
    } else {
      this.recipe = this.recipeService.removeRecipeFromFavorites(
        this.currentUserId,
        this.recipe,
      );
    }
    this.recipeService.updateRecipe(this.recipe);
  }
  //лайкаем рецепт
  @Input() moderMode = false;
  @Output() moderatorAction = new EventEmitter<number[]>();

  approve() {
    this.moderatorAction.emit([this.recipe.id, 1]);
  }
  notApprove() {
    this.moderatorAction.emit([this.recipe.id, 0]);
  }

  likeThisRecipe() {
    if (this.currentUserId === 0) {
      this.noAccessModalShow = true;
      return;
    }

    let updatedRecipe: IRecipe;

    this.isRecipeLiked = !this.isRecipeLiked;

    if (this.isRecipeLiked) {
      updatedRecipe = this.recipeService.likeRecipe(
        this.currentUserId,
        this.recipe,
      );
    } else {
      updatedRecipe = this.recipeService.unlikeRecipe(
        this.currentUserId,
        this.recipe,
      );
    }
    this.recipeService.updateRecipe(updatedRecipe);
  }
  //готовим рецепт
  cookThisRecipe() {
    if (this.currentUserId === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeCooked = !this.isRecipeCooked;

    let updatedRecipe: IRecipe;

    if (this.isRecipeCooked) {
      updatedRecipe = this.recipeService.cookRecipe(
        this.currentUserId,
        this.recipe,
      );
    } else {
      updatedRecipe = this.recipeService.uncookRecipe(
        this.currentUserId,
        this.recipe,
      );
    }

    this.recipeService.updateRecipe(updatedRecipe);
  }

  // модальное окно (пользователь не вошел в аккаунт)
  noAccessModalShow: boolean = false;

  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

}
