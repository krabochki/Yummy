import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Router } from '@angular/router';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-recipe-list-item',
  templateUrl: './recipe-list-item.component.html',
  styleUrls: ['./recipe-list-item.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListItemComponent implements OnInit, OnDestroy {
  @Input() recipe: IRecipe = nullRecipe;
  @Input() context: string = '';
  protected destroyed$: Subject<void> = new Subject<void>();

  likes: number = 0;
  cooks: number = 0;

  editMode: boolean = false;

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

  editModeOff() {
    this.editMode = false;
    console.log('off')
  }
  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((currentUser) => {
        this.currentUserId = currentUser.id;
        this.recipeService.recipes$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((recipes) => {
            const findedRecipe = recipes.find((recipe) => {
              return recipe.id === this.recipe.id;
            });
            if (findedRecipe) this.recipe = findedRecipe;
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
          });
      });

    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((users) => {
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
    this.recipe = this.isRecipeFavorite
      ? this.recipeService.addRecipeToFavorites(this.currentUserId, this.recipe)
      : this.recipeService.removeRecipeFromFavorites(
          this.currentUserId,
          this.recipe,
        );

    this.recipeService
      .updateRecipe(this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        () => console.log('Рецепт успешно добавлен в избранное'),
        (error: Error) =>
          console.error(
            'Ошибка добавления рецепта в избранное: ' + error.message,
          ),
      );
  }

  //(действия модератора по одобрению рецептов потом будут в компоненте полной страницы)

  //лайкаем рецепт
  likeThisRecipe() {
    if (this.currentUserId === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeLiked = !this.isRecipeLiked;

    this.recipe = this.isRecipeLiked
      ? this.recipeService.likeRecipe(this.currentUserId, this.recipe)
      : this.recipeService.unlikeRecipe(this.currentUserId, this.recipe);

    this.recipeService
      .updateRecipe(this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        () => console.log('Рецепт успешно оценен'),
        (error: Error) =>
          console.error('Ошибка оценки рецепта: ' + error.message),
      );
  }
  //готовим рецепт
  cookThisRecipe() {
    if (this.currentUserId === 0) {
      this.noAccessModalShow = true;
      return;
    }

    this.isRecipeCooked = !this.isRecipeCooked;

    this.recipe = this.isRecipeCooked
      ? this.recipeService.cookRecipe(this.currentUserId, this.recipe)
      : this.recipeService.uncookRecipe(this.currentUserId, this.recipe);

    this.recipeService
      .updateRecipe(this.recipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        () => console.log('Рецепт успешно отмечен приготовленным'),
        (error: Error) =>
          console.error(
            'Ошибка отметки рецепта приготовленным: ' + error.message,
          ),
      );
  }

  // модальное окно (пользователь не вошел в аккаунт)
  handleNoAccessModal(result: boolean) {
    if (result) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
