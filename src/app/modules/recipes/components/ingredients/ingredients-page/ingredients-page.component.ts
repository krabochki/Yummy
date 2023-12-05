import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredientsGroup,
} from '../../../models/ingredients';
import { RecipeService } from '../../../services/recipe.service';
import { Subject, takeUntil } from 'rxjs';
import { IRecipe } from '../../../models/recipes';
import { IngredientService } from '../../../services/ingredient.service';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import { baseComparator } from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';

@Component({
  selector: 'app-ingredients-page',
  templateUrl: './ingredients-page.component.html',
  styleUrls: [
    '../../../../authentication/common-styles.scss',
    './ingredients-page.component.scss',
  ],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
})
export class IngredientsPageComponent implements OnInit, OnDestroy {
  protected ingredientGroups: IIngredientsGroup[] = [];
  protected ingredients: IIngredient[] = [];
  protected ingredientsToShow: IIngredient[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();
  protected recipes: IRecipe[] = [];

  searchQuery: string = '';
  autocompleteShow: boolean = false;
  autocomplete: any[] = [];

  successEditModalShow = false;

  currentUser: IUser = { ...nullUser };
  noAccessModalShow = false;

  MAX_DISPLAY_INGREDIENTS_IN_GROUP = 8;
  START_DISPLAY_INGREDIENTS_ON_GROUP_PAGE = 10;
  INGREDIENTS_TO_LOAD = 5;

  ingredientCreatingMode: boolean = false;

  protected title: string = '';

  protected context: string = '';
  protected group: IIngredientsGroup = { ...nullIngredientsGroup };
  constructor(
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private titleService: Title,
  ) {}

  getCurrentUserData() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser));
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  ngOnInit() {
    this.getCurrentUserData();
    this.route.data.subscribe((mainData) => {
      this.context = mainData['filter'];

      this.recipeService.recipes$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          this.recipes = data;

          this.ingredientService.ingredients$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((receivedIngredients: IIngredient[]) => {
              this.ingredientService.ingredientsGroups$
                .pipe(takeUntil(this.destroyed$))
                .subscribe((data) => {
                  this.ingredientGroups = [...data];

                  const ingredients = this.ingredientService
                    .sortIngredients(receivedIngredients, this.recipes)
                    .filter((i) => i.status === 'public');
                  this.ingredients = ingredients;

                  if (!this.ingredientGroups.find((g) => g.id === 0)) {
                    const popularGroup: IIngredientsGroup =
                      this.getPopularGroup();
                    this.ingredientGroups.unshift(popularGroup);
                  }

                  this.cd.markForCheck();
                });
              if (this.context !== 'all-groups') {
                if (this.context === 'ingredient-group') {
                  const groupFromResolver = mainData['IngredientGroupResolver'];
                  const findedGroup = this.ingredientGroups.find(group => group.id === groupFromResolver.id);
                  if (findedGroup) {
                    this.group = findedGroup;
                  }
                  else {
                    this.router.navigateByUrl('/')
                  }
                  
                } else {
                  this.group = this.getPopularGroup();
                }
                this.ingredientsToShow = [
                  ...this.ingredientsOfGroup(this.group).slice(
                    0,
                    this.START_DISPLAY_INGREDIENTS_ON_GROUP_PAGE,
                  ),
                ];
                this.cd.markForCheck();

                this.title = this.group.name;
              } else if (this.context === 'all-groups') {
                this.title = 'Все ингредиенты';
              }
              this.cd.markForCheck();

              this.titleService.setTitle(this.title);
              this.cd.markForCheck();
            });
        });
    });
  }

  createIngredientButtonClick() {
    if (this.currentUser.id > 0) {
      this.ingredientCreatingMode = true;
    } else {
      this.noAccessModalShow = true;
    }
  }

  getIngredientsIds() {
    const ingredientsIds: number[] = [];
    this.ingredients.forEach((ingredient) => {
      ingredientsIds.push(ingredient.id);
    });
    return ingredientsIds;
  }

  loadMoreIngredients() {
    const allIngredients = this.ingredientsOfGroup(this.group);
    const currentLength = this.ingredientsToShow.length;
    const nextIngredients = allIngredients.slice(
      currentLength,
      currentLength + this.INGREDIENTS_TO_LOAD,
    );
    this.ingredientsToShow = [...this.ingredientsToShow, ...nextIngredients];
  }

  getPopularGroup(): IIngredientsGroup {
    return {
      name: 'Популярные ингредиенты',
      id: 0,
      image: '',
      ingredients: this.getIngredientsIds(),
    };
  }

  ingredientsOfGroup(group: IIngredientsGroup): IIngredient[] {
    return this.ingredients.filter((i) => group.ingredients.includes(i.id));
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  blurSearch() {
    this.autocompleteShow = false;
  }

  focusSearch() {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }

  getGroupOfIngredient(ingredient: any) {
    if (ingredient.ingredients) return [];
    const groups = this.ingredientGroups.filter((g) => g.id !== 0);
    return this.ingredientService.getGroupOfIngredient(groups, ingredient);
  }

  turnOnSearch() {
    let ingredientsToSearch: IIngredient[] = this.ingredients;
    let groupsToSearch: IIngredientsGroup[] = this.ingredientGroups.filter(
      (g) => g.id !== 0,
    );
    if (this.context === 'ingredient-group') {
      ingredientsToSearch = this.ingredientsOfGroup(this.group);
      groupsToSearch = [];
    }
    this.autocompleteShow = true;
    if (this.searchQuery.length > 0) {
      this.autocomplete = [];
      const filterGroups: IIngredientsGroup[] = groupsToSearch.filter(
        (group: IIngredientsGroup) =>
          group.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
      const filterIngredients: IIngredient[] = ingredientsToSearch.filter(
        (ingredient: IIngredient) =>
          ingredient.name
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()),
      );
      filterIngredients.forEach((f) => {
        this.autocomplete.push(f);
      });
      filterGroups.forEach((f) => {
        this.autocomplete.push(f);
      });
      this.autocomplete = this.autocomplete.sort((a, b) =>
        baseComparator(a.name, b.name),
      );
    } else this.autocompleteShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
