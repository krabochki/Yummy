import { Component, OnDestroy, OnInit } from '@angular/core';
import { ICategory, ISection } from 'src/app/modules/recipes/models/categories';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ChangeDetectionStrategy } from '@angular/core';
import { SectionService } from '../../services/section.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent implements OnInit, OnDestroy {
  allRecipes: IRecipe[] = [];
  allSections: ICategory[] = [];
  popularRecipes: IRecipe[] = [];
  recentRecipes: IRecipe[] = [];
  currentUser: IUser = { ...nullUser };
  popularRecipesLoaded = false;
  userRecipes: IRecipe[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private sectionService: SectionService,

    private titleService: Title,
    private authService: AuthService,
  ) {
    this.titleService.setTitle('Yummy');
  }

  ngOnInit(): void {

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((currentUser: IUser) => {
        {
          this.currentUser = currentUser;

          if (this.currentUser.id !== 0) {
            this.userRecipes = this.recipeService
              .getRecipesByUser(this.allRecipes, this.currentUser.id)
              .slice(0, 8);
          }
        }
      });

    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((recipes: IRecipe[]) => {
        {
          this.allRecipes = recipes;
          const publicRecipes = this.recipeService.getPublicRecipes(
            this.allRecipes,
          );
          
      
          if (this.currentUser.id !== 0) {
            this.userRecipes = this.recipeService
              .getRecipesByUser(this.allRecipes, this.currentUser.id)
              .slice(0, 8);
          }
          if (!this.popularRecipesLoaded && this.allRecipes.length > 0) {
            this.popularRecipes = this.recipeService
              .getPopularRecipes(publicRecipes)
              .slice(0, 8);
            this.popularRecipesLoaded = true;
          }
          this.recentRecipes = this.recipeService
            .getRecentRecipes(publicRecipes)
            .slice(0, 8);

        }

        
          this.sectionService.sections$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data: ISection[]) => {
              this.allSections = data;
            });
       
      },
    );
  }

  ngOnDestroy():void {
        this.destroyed$.next();
        this.destroyed$.complete();
  }
}
