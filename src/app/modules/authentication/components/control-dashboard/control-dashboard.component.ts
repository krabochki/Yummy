import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Subscription } from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
@Component({
  selector: 'app-control-dashboard',
  templateUrl: './control-dashboard.component.html',
  styleUrls: ['./control-dashboard.component.scss'],
})
export class ControlDashboardComponent implements OnInit {
  constructor(
    private recipeService: RecipeService,
    private titleService: Title,
    private authService: AuthService,
  ) {
    this.titleService.setTitle('Панель модератора');
  }
  currentUserSubscription?: Subscription;
  recipesSubscription?: Subscription;
  currentUser: IUser = nullUser;
  awaitingRecipes: IRecipe[] = [];

  getModeratorAction(action: number[]) {
    if (action[1] === 1) {
      this.approveRecipe(action[0]);
    }
    if (action[1] === 0) {
      this.notApproveRecipe(action[0]);
    }
  }

  notApproveRecipe(id: number) {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'private';
      this.recipeService.updateRecipe(approvedRecipe);
      this.awaitingRecipes = this.awaitingRecipes.filter(
        (recipe) => recipe.id !== id,
      );
    }
  }
  approveRecipe(id: number) {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'public';
      this.recipeService.updateRecipe(approvedRecipe);
      this.awaitingRecipes = this.awaitingRecipes.filter(
        (recipe) => recipe.id !== id,
      );
    }
  }

  ngOnInit(): void {
    this.recipesSubscription = this.recipeService
      .getRecipes()
      .subscribe((recipesData) => {
        this.awaitingRecipes =
          this.recipeService.getAwaitingRecipes(recipesData);
      });
    this.currentUserSubscription = this.authService
      .getCurrentUser()
      .subscribe((data) => {
        this.currentUser = data;
      });
  }
}
