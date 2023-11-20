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
import { IUser, PermissionContext, nullUser } from 'src/app/modules/user-pages/models/users';
import { CategoryService } from '../../../services/category.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { SectionService } from '../../../services/section.service';
import { IRecipe } from '../../../models/recipes';
import { ICategory, ISection } from '../../../models/categories';
import { PluralizationService } from 'src/app/modules/controls/directives/plural.service';
import { Router } from '@angular/router';

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
  private recipes: IRecipe[] = [];
  recipesNumber = 0;

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
    private router:Router,
    private categoryService: CategoryService,
    private cd:ChangeDetectorRef
  ) {}
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
                this.cd.markForCheck()
              }
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
    if (answer) this.successDeleteModalShow = true;
    this.deleteModalShow = false;
  }

  protected handleSuccessDeleteModal() {
    this.successDeleteModalShow = false;
    setTimeout(() => {
      this.deleteCategory();
    }, 300);
  }

  protected deleteCategory(): void {
    if (this.context === 'category')
      this.categoryService.deleteCategory(this.category.id).subscribe(() => {
        const subscribes: Observable<IRecipe | ISection>[] = [];
        const section: ISection = this.sectionService.getSectionOfCategory(
          this.sections,
          this.category,
        );
        section.categories = section.categories.filter(
          (c) => c !== this.category.id,
        );
        subscribes.push(this.sectionService.updateSections(section));
        this.recipeService
          .getRecipesByCategory(this.recipes, this.category)
          .forEach((recipe) => {
            const updatedRecipe = {
              ...{ ...recipe },
              categories: recipe.categories.filter(
                (c) => c !== this.category.id,
              ),
            };
            recipe.categories = recipe.categories.filter(
              (c) => c !== this.category.id,
            );
            subscribes.push(this.recipeService.updateRecipe(updatedRecipe));
          });

        forkJoin(subscribes).subscribe();
      });
    else this.sectionService.deleteSection(this.category.id).subscribe();
  }

  get showDeletingButton() {
    const permissionName: PermissionContext =
      this.context === 'category'
        ? 'show-category-deleting'
        : 'show-section-deleting';
    return this.userService.getPermission(permissionName, this.currentUser);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
