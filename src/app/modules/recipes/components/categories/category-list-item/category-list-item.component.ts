import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-category-list-item',
  templateUrl: './category-list-item.component.html',
  styleUrls: ['./category-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListItemComponent implements OnInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() category: any = null;

  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'section' | 'category' = 'category';
  protected destroyed$: Subject<void> = new Subject<void>();

  recipesNumber = 0;
  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
  ) {}
  ngOnInit() {
    if (this.showRecipesNumber)
      this.recipeService.recipes$.pipe(takeUntil(this.destroyed$))
          .subscribe((data) => {
        this.authService.currentUser$.pipe(takeUntil(this.destroyed$))
          .subscribe((user) => {
          if (this.context === 'category')
            this.recipesNumber = this.recipeService.getRecipesByCategory(
              this.recipeService.getPublicAndAllMyRecipes(data, user.id),
              this.category.id,
            ).length;
          else {
            const sectionRecipesIds: number[] = [];
            //перебираем категории в секции
            this.category.categoriesId.forEach((element: number) => {
              const categoryRecipes = this.recipeService.getRecipesByCategory(
                this.recipeService.getPublicAndAllMyRecipes(data, user.id),
                element,
              );
              //перебираем рецепты в каждой категории
              categoryRecipes.forEach((recipe) => {
                //если рецепт уже добавлен то не добавляем
                if (!sectionRecipesIds.includes(recipe.id))
                  sectionRecipesIds.push(recipe.id);
              });
            });
            this.recipesNumber = sectionRecipesIds.length;
          }
        });
      });
  }

  ngOnDestroy(): void{
     this.destroyed$.next();
     this.destroyed$.complete();
  }
}
