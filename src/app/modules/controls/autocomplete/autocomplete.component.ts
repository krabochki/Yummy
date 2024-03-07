import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
} from '@angular/core';
import { ICategory, ISection } from '../../recipes/models/categories';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { IIngredient, IGroup } from '../../recipes/models/ingredients';
import { IngredientService } from '../../recipes/services/ingredient.service';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SectionService } from '../../recipes/services/section.service';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subscription,
  debounceTime,
  filter,
  forkJoin,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { baseComparator } from 'src/tools/common';
import { CategoryService } from '../../recipes/services/category.service';
import { sub } from 'date-fns';
import { GroupService } from '../../recipes/services/group.service';
import { IRecipe } from '../../recipes/models/recipes';
import { RecipeService } from '../../recipes/services/recipe.service';
import { UpdatesService } from '../../common-pages/services/updates.service';

export interface SectionGroup {
  section: ISection;
  categories: ICategory[];
}

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  animations: [trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true,
    },
  ],
})
export class AutocompleteComponent {
  @Output() anyEmitter = new EventEmitter<string>();
  @Output() categoryEmitter = new EventEmitter<ICategory>();
  @Output() sectionEmitter = new EventEmitter<ISection>();
  @Output() ingredientEmitter = new EventEmitter<IIngredient>();
  @Output() tagEmitter = new EventEmitter<string>();
  @Output() groupEmitter = new EventEmitter<IGroup>();
  @Input() currentUserId = 0;
  @Input() startOnTyping = false;
  @Input() error: string = '';
  @Input() placeholder: string = '';
  @Input() context:
    | 'categories'
    | 'groups'
    | 'tags'
    | 'sections'
    | 'ingredients'
    | 'recipes'
    | 'any' = 'any';
  @Input() disabled: boolean = false;
  @Input() group: SectionGroup[] = [];
  ingredients: IIngredient[] = [];
  @Input() max?: number | undefined = undefined;
  @Input() leaveValueAfterBlur = false;
  groups: IGroup[] = [];
  tags: string[] = [];
  @Input() clearValueOnBlur = false;

  @Input() anyData: string[] = [];
  filterAnyData: string[] = [];

  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)

  autocompleteShow: boolean = false;
  categories: ICategory[] = [];
  @Input() value = '';

  sections: ISection[] = [];

  getFullGroup = false;

  recipes: IRecipe[] = [];
  get noAnySearchMatches() {
    switch (this.context) {
      case 'recipes':
        return this.recipes.length === 0;
      case 'categories':
        return this.group.length === 0;
      case 'ingredients':
        return this.ingredients.length === 0;
      case 'groups':
        return this.groups.length === 0;
      case 'sections':
        return this.sections.length === 0;
      case 'tags':
        return this.tags.length === 0;
      case 'any':
        return this.filterAnyData.length === 0;
    }
  }

  constructor(
    private cd: ChangeDetectorRef,
    private groupService: GroupService,
    private sectionService: SectionService,
    private updateService: UpdatesService,
    private recipeService: RecipeService,
    private router: Router,
    private categoryService: CategoryService,
    private ingredientService: IngredientService,
  ) {}

  focus() {
    if (!this.value) {
      this.filterAnyData = this.anyData;
    }
    if (!this.startOnTyping || (this.startOnTyping && this.value)) {
      this.autocompleteShow = true;
    }
    this.isFocused = true;
    this.isSleep = false;
  }

  blur() {
    this.autocompleteShow = false;
    this.isFocused = false;
    if (this.clearValueOnBlur) {
      this.value = '';
      this.filterAnyData = this.anyData;
    }
    if (this.value !== '') {
      this.isFocused = true;
      this.isSleep = true;
    }
    this.blurEmitter.emit();
  }

  @Output() blurEmitter = new EventEmitter();

  goToLink(link: string): void {
    this.router.navigateByUrl(link);
  }
  addTag(tag: string) {
    this.tagEmitter.emit(tag);
  }
  addCategory(listCategory: ICategory) {
    this.categoryEmitter.emit(listCategory);
  }
  addAny(any: string) {
    this.anyEmitter.emit(any);
    setTimeout(() => {
      this.filterAnyData = this.anyData;
    }, 300);
  }
  @Output() recipeEmitter = new EventEmitter();

  addRecipe(listRecipe: IRecipe) {
    this.recipeEmitter.emit(listRecipe);
  }
  addSection(listSection: ISection) {
    this.sectionEmitter.emit(listSection);
    setTimeout(() => {
      this.sections = [];
    }, 300);
  }
  addIngredientGroup(listIngredientGroup: IGroup) {
    this.groupEmitter.emit(listIngredientGroup);
  }
  addIngredient(listIngredient: IIngredient) {
    this.ingredientEmitter.emit(listIngredient);
  }

  loading = false;
  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchSubscription?: Subscription;
  searchSections() {
    if (this.value !== '') {
      this.autocompleteShow = true;
      this.sections = [];
      this.loading = true;
      const search = this.value.toLowerCase().trim();
      this.searchQuerySubject.next(search);
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }
      this.searchSubscription = this.searchQuerySubject
        .pipe(
          debounceTime(1000),
          filter((query) => query.length > 0), // Фильтруем пустые запросы
          switchMap(() => {
            return this.sectionService.getSectionsBySearch(search);
          }),
        )
        .subscribe((receivedSections: ISection[]) => {
          this.sections = receivedSections.sort((a, b) =>
            baseComparator(a.name, b.name),
          );
          this.loading = false;
          this.cd.markForCheck();
        });
    } else {
      this.autocompleteShow = false;
      this.sections = JSON.parse(JSON.stringify([]));
    }
  }

  searchIngredientsGroups() {
    if (this.value !== '') {
      this.autocompleteShow = true;
      this.groups = [];
      this.loading = true;
      const search = this.value.toLowerCase().trim();
      this.searchQuerySubject.next(search);
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }
      this.searchSubscription = this.searchQuerySubject
        .pipe(
          debounceTime(1000),
          filter((query) => query.length > 0), // Фильтруем пустые запросы
          switchMap(() => {
            return this.groupService.getGroupsBySearch(search);
          }),
        )
        .subscribe((receivedGroups: IGroup[]) => {
          this.groups = receivedGroups.sort((a, b) =>
            baseComparator(a.name, b.name),
          );
          this.loading = false;
          this.cd.markForCheck();
        });
    } else {
      this.autocompleteShow = false;
      this.groups = JSON.parse(JSON.stringify([]));
    }
  }

  searchAnyData() {
    if (this.value !== '') {
      this.filterAnyData = [];
      const search = this.value.toLowerCase().replace(/\s/g, '');
      const filterData: string[] = [];
      const allData = this.anyData;

      allData.forEach((item: string) => {
        if (item.toLowerCase().replace(/\s/g, '').includes(search))
          filterData.push(item);
      });

      filterData.forEach((element) => {
        this.filterAnyData.push(element);
      });
    } else {
      this.filterAnyData = this.anyData;
    }
  }

  searchIngredients() {
    if (this.value !== '') {
      this.autocompleteShow = true;
      this.ingredients = [];
      this.loading = true;
      const search = this.value.toLowerCase().trim();
      this.searchQuerySubject.next(search);
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }
      this.searchSubscription = this.searchQuerySubject
        .pipe(
          debounceTime(1000),
          filter((query) => query.length > 0), // Фильтруем пустые запросы
          switchMap(() => {
            return this.ingredientService.getIngredientsBySearch(search);
          }),
        )
        .subscribe((receivedIngredients: IIngredient[]) => {
          this.ingredients = receivedIngredients.sort((a, b) =>
            baseComparator(a.name, b.name),
          );
          this.loading = false;
          this.cd.markForCheck();
        });
    } else {
      this.autocompleteShow = false;
      this.ingredients = JSON.parse(JSON.stringify([]));
    }
  }

  get noSearchMatchDescription() {
    let target = '';
    switch (this.context) {
      case 'sections':
        target = 'секций';
        break;
      case 'groups':
        target = 'групп ингредиентов';
        break;

      case 'ingredients':
        target = 'ингредиентов';
        break;
      case 'categories':
        target = 'категорий';
        break;
      case 'tags':
        target = 'тегов';
        break;
      case 'recipes':
        target = 'рецептов';
        break;
      case 'any':
        return 'По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска';
    }
    return `По вашему запросу нет никаких ${target}. Попробуйте изменить параметры поиска`;
  }

  searchCategories() {
    if (this.value !== '') {
      this.group = [];
      const search = this.value.toLowerCase().trim();
      this.autocompleteShow = true;
      this.loading = true;
      this.cd.markForCheck();

      const categorySubscribe = this.categoryService
        .getCategoriesGroupsBySearch(search)
        .pipe(
          tap((receivedCategories: ICategory[]) => {
            const sectionGroupsMap = new Map<number, ICategory[]>();

            receivedCategories.forEach((category) => {
              const { sectionId, ...rest } = category;
              if (!sectionGroupsMap.has(sectionId!)) {
                sectionGroupsMap.set(sectionId!, []);
              }
              sectionGroupsMap.get(sectionId!)?.push({ sectionId, ...rest });
            });

            const sectionGroups: {
              sectionId: number;
              categories: ICategory[];
            }[] = Array.from(sectionGroupsMap.entries()).map(
              ([sectionId, categoryArray]) => ({
                sectionId,
                categories: categoryArray,
              }),
            );

            const groups: SectionGroup[] = [];

            const subscribes: Observable<any>[] = [];
            sectionGroups.forEach((group) => {
              subscribes.push(
                this.sectionService
                  .getSectionShortInfoForAwaitingCategory(group.sectionId)
                  .pipe(
                    tap((section: ISection[]) => {
                      groups.push({
                        section: section[0],
                        categories: group.categories,
                      });
                    }),
                  ),
              );
            });
            if (subscribes.length)
              forkJoin(subscribes)
                .pipe(
                  tap(() => {
                    this.group = groups;
                    this.loading = false;
                    this.cd.markForCheck();
                  }),
                )
                .subscribe();
            else {
              this.loading = false;
              this.cd.markForCheck();
            }
          }),
        );

      this.searchQuerySubject.next(search);
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }
      this.searchSubscription = this.searchQuerySubject
        .pipe(
          debounceTime(1000),
          filter((query) => query.length > 0), // Фильтруем пустые запросы
          switchMap(() => {
            return categorySubscribe;
          }),
        )
        .subscribe();
    } else {
      this.group = [];
      this.autocompleteShow = false;
    }
  }

  searchRecipes() {
    if (this.value !== '') {
      this.autocompleteShow = true;
      this.recipes = [];
      this.loading = true;
      const search = this.value.toLowerCase().trim();
      this.searchQuerySubject.next(search);
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }
      this.searchSubscription = this.searchQuerySubject
        .pipe(
          debounceTime(1000),
          filter((query) => query.length > 0), // Фильтруем пустые запросы
          switchMap(() => {
            return this.recipeService.getPublicAndMyRecipesBySearch(
              search,
              this.currentUserId,
            );
          }),
        )
        .subscribe((receivedRecipes: IRecipe[]) => {
          this.recipes = receivedRecipes;
          this.loading = false;
          this.cd.markForCheck();
        });
    } else {
      this.autocompleteShow = false;
      this.recipes = JSON.parse(JSON.stringify([]));
    }
  }

  searchTags() {
    if (this.value !== '') {
      this.autocompleteShow = true;
      this.tags = [];
      this.loading = true;
      const search = this.value.toLowerCase().trim();
      this.searchQuerySubject.next(search);
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }
      this.searchSubscription = this.searchQuerySubject
        .pipe(
          debounceTime(1000),
          filter((query) => query.length > 0), // Фильтруем пустые запросы
          switchMap(() => {
            return this.updateService.getTagsBySearch(search);
          }),
        )
        .subscribe((tags: string[]) => {
          this.tags = tags;
          this.loading = false;
          this.cd.markForCheck();
        });
    } else {
      this.autocompleteShow = false;
      this.tags = JSON.parse(JSON.stringify([]));
    }
  }

  search() {
    switch (this.context) {
      case 'sections':
        this.searchSections();
        break;
      case 'groups':
        this.searchIngredientsGroups();
        break;
      case 'recipes':
        this.searchRecipes();
        break;
      case 'tags':
        this.searchTags();
        break;
      case 'ingredients':
        this.searchIngredients();
        break;

      case 'categories':
        this.searchCategories();
        break;
      case 'any':
        this.searchAnyData();
        break;
    }
  }

  change() {
    this.onChange(this.value);
  }
  onChange: any = () => {
    //
  };
  onTouched: any = () => {
    //
  };
  writeValue(value: string): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
