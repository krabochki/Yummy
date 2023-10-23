import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Subscription } from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { ISection } from 'src/app/modules/recipes/models/categories';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'app-control-dashboard',
  templateUrl: './control-dashboard.component.html',
  styleUrls: ['./control-dashboard.component.scss'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ControlDashboardComponent implements OnInit, OnDestroy {
  currentUserSubscription?: Subscription;
  recipesSubscription?: Subscription;
  sectionsSubscription?: Subscription;
  currentUser: IUser = { ...nullUser };
  awaitingRecipes: IRecipe[] = [];
  sections: ISection[] = [];

  constructor(
    private recipeService: RecipeService,
    private titleService: Title,
    private authService: AuthService,
    private categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    this.recipesSubscription = this.recipeService.recipes$.subscribe(
      (recipesData) => {
        this.awaitingRecipes =
          this.recipeService.getAwaitingRecipes(recipesData);
      },
    );
    this.currentUserSubscription = this.authService
      .getCurrentUser()
      .subscribe((data) => {
        this.currentUser = data;
        this.titleService.setTitle(
          this.currentUser.role === 'moderator'
            ? 'Панель модератора'
            : 'Панель администратора',
        );
      });

    this.sectionsSubscription = this.categoryService.sections$.subscribe(
      (data) => {
        this.sections = data;
      },
    );
  }

  notApproveRecipe(id: number) {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'private';
      this.recipeService.updateRecipe(approvedRecipe).subscribe(
        () => {
          this.awaitingRecipes = this.awaitingRecipes.filter(
            (recipe) => recipe.id !== id,
          );
        },
        (error) => {
          console.error(
            'Произошла ошибка при обновлении статуса рецепта модератором: ',
            error,
          );
        },
      );
    }
  }

  approveRecipe(id: number) {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'public';
      this.recipeService.updateRecipe(approvedRecipe).subscribe(
        () => {
          this.awaitingRecipes = this.awaitingRecipes.filter(
            (recipe) => recipe.id !== id,
          );
        },
        (error) => {
          console.error(
            'Произошла ошибка при обновлении статуса рецепта модератором: ',
            error,
          );
        },
      );
    }
  }

  ngOnDestroy() {
    this.currentUserSubscription?.unsubscribe();
    this.sectionsSubscription?.unsubscribe();
    this.recipesSubscription?.unsubscribe();
  }
}
