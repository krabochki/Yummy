import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

@Component({
  selector: 'app-recipe-list-item',
  templateUrl: './recipe-list-item.component.html',
  styleUrls: ['./recipe-list-item.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeListItemComponent implements OnInit {
  @Input() recipe: IRecipe = nullRecipe;
  @Input() context: string = '';

  likes: number = 0;
  cooks: number = 0;

  isRecipeFavorite: boolean = false;
  isRecipeLiked: boolean = false;
  isRecipeCooked: boolean = false;

  noAccessModalShow: boolean = false;

  dataLoaded = false;

  currentUserId = 0;
  author: IUser = { ...nullUser };

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}

  @Input() showAuthor: boolean = true;

  ngOnInit() {
    this.authService.currentUser$.subscribe((currentUser) => {
      this.currentUserId = currentUser.id;
      this.recipeService.recipes$.subscribe((recipes) => {
        const findedRecipe = recipes.find((recipe) => {
          if (recipe.id === this.recipe.id) return true;
          else return false;
        });
        if (findedRecipe) this.recipe = findedRecipe;
        if (this.currentUserId !== 0) {
          this.isRecipeLiked = this.recipe.likesId.includes(this.currentUserId);
          this.isRecipeCooked = this.recipe.cooksId.includes(
            this.currentUserId,
          );
          this.isRecipeFavorite = this.recipe.favoritesId.includes(
            this.currentUserId,
          );
        }
      });
    });

    this.userService.users$.subscribe((users) => {
      const findedAuthor = users.find((user) => {
        if (user.id === this.recipe.authorId) return true;
        else return false;
      });
      if (findedAuthor) this.author = findedAuthor;
      this.dataLoaded = true;
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
    this.recipeService.updateRecipe(this.recipe).subscribe();
  }

  //(действия модератора по одобрению рецептов потом будут в компоненте полной страницы)

  //лайкаем рецепт
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
    this.recipeService.updateRecipe(updatedRecipe).subscribe();
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

    this.recipeService.updateRecipe(updatedRecipe).subscribe();
  }

  // модальное окно (пользователь не вошел в аккаунт)
  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }
}
