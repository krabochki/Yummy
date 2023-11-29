import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Observable, Subject, forkJoin, takeUntil } from 'rxjs';
import {
  IUser,
  PermissionContext,
  nullUser,
} from 'src/app/modules/user-pages/models/users';
import { CategoryService } from '../../../services/category.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { SectionService } from '../../../services/section.service';
import { IRecipe } from '../../../models/recipes';
import { ICategory, ISection } from '../../../models/categories';
import { PluralizationService } from 'src/app/modules/controls/directives/plural.service';
import { Router } from '@angular/router';
import { supabase } from 'src/app/modules/controls/image/supabase-data';

@Component({
  selector: 'app-category-list-item',
  templateUrl: './category-list-item.component.html',
  styleUrls: ['./category-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal())],
})
export class CategoryListItemComponent implements OnInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() category: any = null;
  @Input() showRecipesNumber: boolean = false;
  @Input() context: 'section' | 'category' = 'category';


  protected currentUser: IUser = { ...nullUser };

  protected destroyed$: Subject<void> = new Subject<void>();

  private categories: ICategory[] = [];
  private sections: ISection[] = [];
  loadingText = ''
  private recipes: IRecipe[] = [];
  loading = false;
  recipesNumber = 0;
  picture = '';
  placeholder = 'assets/images/category.png';

  get title(): string {
    return this.category.categories
      ? `${this.category.name} (в категориях этого раздела ${
          this.recipesNumber
        } ${this.pluralService.getPluralForm(this.recipesNumber, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} без повторений)`
      : `${this.category.name} (${
          this.recipesNumber
        } ${this.pluralService.getPluralForm(this.recipesNumber, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} в этой категории)`;
  }

  constructor(
    private userService: UserService,
    private recipeService: RecipeService,
    private sectionService: SectionService,
    private authService: AuthService,
    private pluralService: PluralizationService,
    private router: Router,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
  ) {}

  downloadUserpicFromSupabase(path: string) {
    if (this.category.categories) {
              this.picture = supabase.storage
          .from('sections')
          .getPublicUrl(path).data.publicUrl;

    } else {
        this.picture = supabase.storage
          .from('categories')
          .getPublicUrl(path).data.publicUrl;
    }
  
    this.cd.markForCheck();
  }

  ngOnInit() {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.sections = data;
      });
    if (this.showRecipesNumber)
      this.recipeService.recipes$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.recipes = data;
          this.authService.currentUser$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((user) => {
              this.currentUser = user;
              if (this.category.photo) {
                this.downloadUserpicFromSupabase(this.category.photo);
              }
              if (this.context === 'category')
                this.recipesNumber = this.recipeService.getRecipesByCategory(
                  this.recipeService.getPublicAndAllMyRecipes(data, user.id),
                  this.category.id,
                ).length;
              else {
                const sectionRecipesIds: number[] = [];
                //перебираем категории в секции
                if (this.category.categories)
                  this.category.categories.forEach((element: number) => {
                    const categoryRecipes =
                      this.recipeService.getRecipesByCategory(
                        this.recipeService.getPublicAndAllMyRecipes(
                          data,
                          user.id,
                        ),
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
              this.cd.markForCheck();
            });
        });
  }

  protected deleteModalShow: boolean = false;
  protected successDeleteModalShow: boolean = false;

  clickDeleteButton($event: any) {
    $event.preventDefault();
    $event.stopPropagation();
    this.deleteModalShow = true;
  }

  protected handleDeleteModal(answer: boolean) {
    if (answer) this.deleteCategory();
    this.deleteModalShow = false;
  }

  async deleteSectionFromSupabase(section: ISection) {

    this.loadingText = 'Удаляем раздел... Подождите немного...';
    this.loading = true;
    this.cd.markForCheck();
    await this.sectionService.deleteSectionFromSupabase(section.id);
    this.loading = false;
    this.cd.markForCheck();
  }

  async deleteCategoryFromSupabase(category: ICategory) {
        this.loadingText = 'Удаляем категорию... Подождите немного...';

    this.loading = true;
    this.cd.markForCheck();
    await this.categoryService.deleteCategoryFromSupabase(category.id);
    this.loading = false;
    this.updateRecipesAfterDeletingCategory();
    this.cd.markForCheck();
  }

  updateRecipesAfterDeletingCategory() {
    const section: ISection = this.sectionService.getSectionOfCategory(
      this.sections,
      this.category,
    );
    section.categories = section.categories.filter(
      (c) => c !== this.category.id,
    );
    this.sectionService.updateSectionInSupabase(section);
    this.recipeService
      .getRecipesByCategory(this.recipes, this.category)
      .forEach((recipe) => {
        const updatedRecipe = {
          ...{ ...recipe },
          categories: recipe.categories.filter((c) => c !== this.category.id),
        };
        this.updateRecipe(updatedRecipe);
      });
  }

  protected deleteCategory(): void {
    if (this.context === 'category') {
      this.deleteCategoryFromSupabase(this.category);
    } else this.deleteSectionFromSupabase(this.category);
    if (this.category.photo) {
      if (this.category.categories) {
        this.deleteOldSectionPic(this.category.photo);
      } else {
        this.deleteOldCategoryPic(this.category.photo);
      }
    }
  }

  async updateRecipe(recipe: IRecipe) {
    await this.recipeService.updateRecipeFunction(recipe);
  }

  get showDeletingButton() {
    const permissionName: PermissionContext =
      this.context === 'category'
        ? 'show-category-deleting'
        : 'show-section-deleting';
    return this.userService.getPermission(permissionName, this.currentUser);
  }

  async deleteOldCategoryPic(path: string) {
    await supabase.storage.from('categories').remove([path]);
  }

  async deleteOldSectionPic(path: string) {
    await supabase.storage.from('sections').remove([path]);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
