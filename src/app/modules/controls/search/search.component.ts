import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../recipes/services/category.service';
import {
  ICategory,
  ISection,
  nullCategory,
  nullSection,
} from '../../recipes/models/categories';
import { baseComparator } from 'src/tools/common';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import {
  of,
  debounceTime,
  switchMap,
  filter,
  BehaviorSubject,
  Observable,
  Subscription,
  EMPTY,
} from 'rxjs';
import { SectionService } from '../../recipes/services/section.service';
import { RecipeService } from '../../recipes/services/recipe.service';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { GroupService } from '../../recipes/services/group.service';
import {
  IGroup,
  IIngredient,
  nullGroup,
  nullIngredient,
} from '../../recipes/models/ingredients';
import { IngredientService } from '../../recipes/services/ingredient.service';
import { MatchService } from '../../recipes/components/recipes/match-recipes/match.service';
import { UserService } from '../../user-pages/services/user.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  animations: [trigger('auto-complete', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  @Output() ClickEmitter = new EventEmitter<any>();
  @Input() context:
    | 'section-categories'
    | 'public-recipes'
    | 'favorite-recipes'
    | 'liked-recipes'
    | 'public-and-my-recipes'
    | 'favorite-recipes'
    | 'ingredients'
    | 'group-ingredients'
    | 'cooked-recipes'
    | 'my-recipes'
    | 'match-ingredients'
    | 'following-recipes'
    | 'groups'
    | 'discussed-recipes'
    | 'recipes-by-ingredient'
    | 'commented-recipes'
    | 'groups & ingredients'
    | 'planned-recipes'
    | 'popular-categories'
    | 'sections'
    | 'category-recipes'
    | 'most-viewed'
    | 'popular'
    | 'nearby'
    | 'managers'
    | 'following'
    | 'productive'
    | 'all'
    | 'new'
    | 'sections & categories' = 'section-categories';
  @Input() section: ISection = nullSection;
  @Input() group: IGroup = nullGroup;
  @Input() ingredient: IIngredient = nullIngredient;
  @Input() category: ICategory = nullCategory;
  @Input() disabled = false;
  loading = false;
  autocompleteShow = false;
  searchQuery = '';
  autocomplete: any[] = [];
  preloaderArray: string[] = [
    'Загрузка',
    'ЗагрузкаЗагрузка',
    'ЗагрузкаЗагр',
    'ЗагрузкаЗагрузкаЗагруз',
    'ЗагрузкаЗагрузка',
    'ЗагрузкаЗагр',
  ];

  currentUser: IUser = nullUser;

  constructor(
    private router: Router,
    private sectionService: SectionService,
    private groupService: GroupService,
    private authService: AuthService,
    private matchService: MatchService,
    private cd: ChangeDetectorRef,
    private userService: UserService,
    private ingredientService: IngredientService,
    private categoryService: CategoryService,
    private recipeService: RecipeService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((currentUser: IUser) => {
      this.currentUser = currentUser;
    });
  }
  blurSearch() {
    this.autocompleteShow = false;
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  focusSearch() {
    if (this.searchQuery !== '') {
      this.turnOnSearch();
    }
  }

  getLink(item: any) {
    if (this.userContext) return `/cooks/list/${item.id}`;

    if (this.context.includes('recipes')) return `/recipes/list/${item.id}`;

    switch (this.context) {
      case 'groups':
        return `/groups/list/${item.id}`;

      case 'sections':
        return `/sections/list/${item.id}`;
      case 'ingredients':
        return `/ingredients/list/${item.id}`;
      case 'recipes-by-ingredient':
        return `/recipes/list/${item.id}`;
      case 'section-categories':
        return `/categories/list/${item.id}`;
      case 'popular-categories':
        return `/categories/list/${item.id}`;
      case 'group-ingredients':
        return `/ingredients/list/${item.id}`;
      case 'sections & categories':
        if (item.type === 'section') return `/sections/list/${item.id}`;
        else return `/categories/list/${item.id}`;
      case 'groups & ingredients':
        if (item.type === 'group') return `/groups/list/${item.id}`;
        else return `/ingredients/list/${item.id}`;
      case 'match-ingredients':
        return null;
      default:
        break;
    }
    return '';
  }

  get userContext() {
    return (
      this.context === 'all' ||
      this.context === 'following' ||
      this.context === 'managers' ||
      this.context === 'nearby' ||
      this.context === 'popular' ||
      this.context === 'new' ||
      this.context === 'productive' ||
      this.context === 'most-viewed'
    );
  }

  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchSubscription?: Subscription;

  turnOnSearch() {
    if (this.searchQuery.length > 0) {
      this.autocompleteShow = true;
      this.autocomplete = [];
      this.loading = true; // Устанавливаем loading только перед запросом

      this.searchQuerySubject.next(this.searchQuery);

      // Отменяем предыдущую подписку, если она существует
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }

      this.searchSubscription = this.searchQuerySubject
        .pipe(
          debounceTime(1000),
          filter((query) => query.length > 0), // Фильтруем пустые запросы
          switchMap((query) => {
            let subscribe: Observable<any> = EMPTY;
            switch (this.context) {
              case 'all':
                subscribe = this.userService.getAllUsersBySearch(query);
                break;
              case 'following':
                subscribe = this.userService.getFollowingsBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'managers':
                subscribe = this.userService.getManagersBySearch(query);
                break;
              case 'nearby':
                subscribe = this.userService.getNearbyBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'popular':
                subscribe = this.userService.getPopularBySearch(query);

                break;
              case 'productive':

                                subscribe =
                                  this.userService.getMostProductiveBySearch(query, this.currentUser.id);

                break;
              case 'most-viewed':
                subscribe = this.userService.getMostViewedBySearch(query);
                break;
              case 'new':
                subscribe = this.userService.getAllUsersBySearch(query);
                break;
              case 'public-recipes':
                subscribe = this.recipeService.getPublicRecipesBySearch(query);
                break;
              case 'public-and-my-recipes':
                subscribe = this.recipeService.getPublicAndMyRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'recipes-by-ingredient':
                subscribe = this.recipeService.getRecipesByIngredientBySearch(
                  query,
                  this.currentUser.id,
                  this.ingredient.id,
                );
                break;
              case 'commented-recipes':
                subscribe = this.recipeService.getCommentedRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'cooked-recipes':
                subscribe = this.recipeService.getCookedRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'match-ingredients':
                subscribe = this.matchService.getIngredientsBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'discussed-recipes':
                subscribe =
                  this.recipeService.getDiscussedRecipesBySearch(query);
                break;
              case 'favorite-recipes':
                subscribe = this.recipeService.getFavoriteRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'sections':
                subscribe = this.sectionService.getSectionsBySearch(
                  this.searchQuery,
                );
                break;
              case 'liked-recipes':
                subscribe = this.recipeService.getLikedRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'my-recipes':
                subscribe = this.recipeService.getMyRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'planned-recipes':
                subscribe = this.recipeService.getPlannedRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'following-recipes':
                subscribe = this.recipeService.getFollowingRecipesBySearch(
                  query,
                  this.currentUser.id,
                );
                break;
              case 'category-recipes':
                subscribe = this.recipeService.getRecipesOfCategoryBySearch(
                  query,
                  this.category.id,
                  this.currentUser.id,
                );
                break;
              case 'popular-categories':
                subscribe =
                  this.categoryService.getPopularCategoriesBySearch(query);
                break;
              case 'section-categories':
                subscribe = this.categoryService.getCategoriesBySearch(
                  query,
                  this.section.id,
                );
                break;
              case 'sections & categories':
                subscribe =
                  this.sectionService.getCategoriesAndSectionsBySearch(query);
                break;

              case 'groups & ingredients':
                subscribe =
                  this.groupService.getGroupsAndIngredientsBySearch(query);
                break;

              case 'groups':
                subscribe = this.groupService.getGroupsBySearch(query);
                break;
              case 'group-ingredients':
                subscribe = this.groupService.getGroupIngredientsBySearch(
                  query,
                  this.group.id,
                );
                break;
              case 'ingredients':
                subscribe =
                  this.ingredientService.getIngredientsBySearch(query);
                break;
            }
            return subscribe;
          }),
        )
        .subscribe((response: any) => {
          this.autocomplete = response;
          this.loading = false;
          this.cd.markForCheck();
        });
    } else {
      this.autocompleteShow = false;
    }
  }
}
