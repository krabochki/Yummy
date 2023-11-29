import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  IIngredient,
  IIngredientsGroup,
} from '../../../models/ingredients';
import { Subject, takeUntil } from 'rxjs';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import {
  IUser,
  PermissionContext,
  nullUser,
} from 'src/app/modules/user-pages/models/users';
import { IngredientService } from '../../../services/ingredient.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { PluralizationService } from 'src/app/modules/controls/directives/plural.service';
import { supabase } from 'src/app/modules/controls/image/supabase-data';

@Component({
  selector: 'app-ingredient-list-item',
  templateUrl: './ingredient-list-item.component.html',
  styleUrls: ['./ingredient-list-item.component.scss'],
  animations: [trigger('modal', modal())],
})
export class IngredientListItemComponent implements OnInit, OnDestroy {
  @Input() ingredient: any = null;
  @Input() context: 'ingredient' | 'group' = 'ingredient';

  currentUser: IUser = nullUser;
  deleteModalShow: boolean = false;
  private groups: IIngredientsGroup[] = [];
  private ingredients: IIngredient[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  get showDeletingButton() {
    const permissionName: PermissionContext =
      this.context === 'ingredient'
        ? 'show-ingredient-deleting'
        : 'show-ingredient-group-deleting';
    return this.userService.getPermission(permissionName, this.currentUser);
  }

  recipesNumber = 0;
  constructor(
    private recipeService: RecipeService,
    private userService: UserService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private ingredientService: IngredientService,
    private pluralService: PluralizationService,
  ) {}
  ngOnInit() {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedIngredients: IIngredient[]) =>
          (this.ingredients = receivedIngredients.filter(
            (i) => i.status === 'public',
          )),
      );
    this.ingredientService.ingredientsGroups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedGroups: IIngredientsGroup[]) => {
          (this.groups = receivedGroups)
        },
      );
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receiverUser: IUser) => (this.currentUser = receiverUser));
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        const publicAndAllMyRecipes =
          this.recipeService.getPublicAndAllMyRecipes(
            data,
            this.currentUser.id,
          );
        if (this.ingredient.image) {
          this.downloadUserpicFromSupabase(this.ingredient.image);
        }

        if (this.context === 'ingredient') {
          this.recipesNumber = this.recipeService.getRecipesByIngredient(
            publicAndAllMyRecipes,
            this.ingredient,
          ).length;
        } else {
          const group: IIngredientsGroup = this.ingredient;
          this.recipesNumber = this.ingredientService.getRecipesNumberOfGroup(
            group,
            this.ingredients,
            publicAndAllMyRecipes,
          );
        }
      });
  }

  get title(): string {
    return this.ingredient.ingredients
      ? `${this.ingredient.name} (в ингредиентах этой группы ${
          this.recipesNumber
        } ${this.pluralService.getPluralForm(this.recipesNumber, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} без повторений)`
      : `${this.ingredient.name} (${
          this.recipesNumber
        } ${this.pluralService.getPluralForm(this.recipesNumber, [
          'рецепт',
          'рецепта',
          'рецептов',
        ])} с этим ингредиентом)`;
  }

  get link() {
    return this.ingredient.ingredients
      ? '/ingredients/groups/' + this.ingredient.id
      : '/ingredients/list/' + this.ingredient.id;
  }
  loading = false;

  protected handleDeleteModal(answer: boolean) {
    if (answer) this.deleteIngredient();

    this.deleteModalShow = false;
  }
  async deleteOldIngredientPic(path: string) {
    await supabase.storage.from('ingredients').remove([path]);
  }

  placeholder = '/assets/images/ingredient.png';
  picture = '';
  downloadUserpicFromSupabase(path: string) {
    if (this.ingredient.ingredients) {
        this.picture = supabase.storage
          .from('groups')
          .getPublicUrl(path).data.publicUrl;
    } else {
      this.picture = supabase.storage
        .from('ingredients')
        .getPublicUrl(path).data.publicUrl;
    }

    this.cd.markForCheck();
  }

  async deleteIngredient() {
    if (this.context === 'group') {
      this.loading = true;
      this.cd.markForCheck();
      await this.ingredientService.deleteGroupFromSupabase(this.ingredient.id);
      this.loading = false;
      this.cd.markForCheck();
    } else {
      this.loading = true;
      this.cd.markForCheck();
      await this.ingredientService.deleteIngredientFromSupabase(
        this.ingredient.id,
      );
      if (this.ingredient.image)
        this.deleteOldIngredientPic(this.ingredient.image);
      this.loading = false;
      this.cd.markForCheck();

      //перебираем группы ингредиента и убираем ингредиент из списка ингредиентов группы
      const groups: IIngredientsGroup[] =
        this.ingredientService.getGroupOfIngredient(
          this.groups,
          this.ingredient,
        );
      groups.forEach((group) => {
        const updatedGroup = {
          ...{ ...group },
          ingredients: { ...group }.ingredients.filter(
            (i) => i !== this.ingredient.id,
          ),
        };
        this.updateGroup(updatedGroup);
      });
    }
  }

  async updateGroup(group: IIngredientsGroup) {
    await this.ingredientService.updateGroupInSupabase(group);
  }

  clickDeleteButton($event: any) {
    $event.preventDefault();
    $event.stopPropagation();
    this.deleteModalShow = true;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
