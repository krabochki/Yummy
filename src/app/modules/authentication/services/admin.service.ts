import { Injectable } from '@angular/core';
import {
  IComment,
  ICommentReport,
  ICommentReportForAdmin,
} from '../../recipes/models/comments';
import {
  getComment,
  getRecipe,
} from '../components/control-dashboard/quick-actions';
import { IRecipe } from '../../recipes/models/recipes';
import { RecipeService } from '../../recipes/services/recipe.service';
import { Observable } from 'rxjs';
import { ICategory, ISection } from '../../recipes/models/categories';
import { CategoryService } from '../../recipes/services/category.service';
import { SectionService } from '../../recipes/services/section.service';
import { IIngredient, IIngredientsGroup } from '../../recipes/models/ingredients';
import { IngredientService } from '../../recipes/services/ingredient.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private sectionService: SectionService,
    private ingredientService: IngredientService,
  ) {}

  public blockComment(
    report: ICommentReportForAdmin,
    recipes: IRecipe[],
  ): Observable<IRecipe> {
    const recipe = getRecipe(report.recipe, recipes);

    const updatedComments: IComment[] = recipe.comments.filter(
      (c) => c.id !== report.comment,
    );
    const updatedReports: ICommentReport[] = recipe.reports.filter(
      (r) => r.comment !== report.comment,
    );

    return this.recipeService.updateRecipe({
      ...recipe,
      comments: updatedComments,
      reports: updatedReports,
    });
  }

  public approveRecipe(recipe: IRecipe) {
    const approvedRecipe = this.recipeService.approveRecipe(recipe);
    return this.recipeService.updateRecipe(approvedRecipe);
  }

  approveIngredient(ingredient: IIngredient) {
    const approvedIngredient: IIngredient = {
      ...{ ...ingredient },
      status: 'public',
    };
    return this.ingredientService.updateIngredient(approvedIngredient);
  }

  dismissIngredient(ingredient: IIngredient) {
    return this.ingredientService.deleteIngredient(ingredient.id);
  }

  updateIngredientGroupsAfterDismissingIngredient(ingredient: IIngredient, groups:IIngredientsGroup[]):Observable<IIngredientsGroup>[] {
    const ingredientGroups = groups.filter(g => g.ingredients.includes(ingredient.id));
    const subscribes:Observable<IIngredientsGroup>[] = [];
    if (ingredientGroups.length > 0) {
      ingredientGroups.forEach(ingredientGroup => {
        const updatedGroup = {
          ...{ ...ingredientGroup },
          ingredients: { ...ingredientGroup }.ingredients.filter(i => i !== ingredient.id)
        }
        subscribes.push(this.ingredientService.updateIngredientGroup(updatedGroup))
      });
    }
    return subscribes;
  }

  public dismissRecipe(recipe: IRecipe): Observable<IRecipe> {
    const dismissedRecipe = this.recipeService.dismissRecipe(recipe);
    return this.recipeService.updateRecipe(dismissedRecipe);
  }

  public updateSectionAfterDismissCategory(
    section: ISection,
    category: ICategory,
  ) {
    section.categories = section.categories.filter(
      (categoryId) => categoryId !== category?.id,
    );

    return this.sectionService.updateSections(section);
  }
  public dismissCategory(category: ICategory): Observable<ICategory> {
    return this.categoryService.deleteCategory(category.id);
  }

  public approveCategory(category: ICategory): Observable<ICategory> {
    category.status = 'public';
    return this.categoryService.updateCategory(category);
  }

  public leaveComment(recipe: IRecipe, report: ICommentReportForAdmin) {
    const updatedReports = recipe.reports.filter(
      (item) => item.comment !== report.comment,
    );
    return this.recipeService.updateRecipe({
      ...recipe,
      reports: updatedReports,
    });
  }
}
