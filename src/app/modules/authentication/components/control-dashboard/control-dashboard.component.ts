import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { ISection } from 'src/app/modules/recipes/models/categories';
import { ChangeDetectionStrategy } from '@angular/core';
import { SectionService } from 'src/app/modules/recipes/services/section.service';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-control-dashboard',
  templateUrl: './control-dashboard.component.html',
  styleUrls: ['./control-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlDashboardComponent implements OnInit, OnDestroy {
  currentUser: IUser = { ...nullUser };
  awaitingRecipes: IRecipe[] = [];
  sections: ISection[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private titleService: Title,
    private authService: AuthService,
    private sectionService: SectionService,
  ) {}

  ngOnInit(): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes: IRecipe[]) => {
        this.awaitingRecipes =
          this.recipeService.getAwaitingRecipes(receivedRecipes);
      });
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        {
          this.currentUser = receivedUser;
          this.titleService.setTitle(
            this.currentUser.role === 'moderator'
              ? 'Панель модератора'
              : 'Панель администратора',
          );
        }
      });
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedSections: ISection[]) => {
        {
          this.sections = receivedSections;
        }
      });
  }

  notApproveRecipe(id: number): void {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'private';
       this.recipeService.updateRecipe(approvedRecipe)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
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

  approveRecipe(id: number): void {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'public';
      this.recipeService
        .updateRecipe(approvedRecipe)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
