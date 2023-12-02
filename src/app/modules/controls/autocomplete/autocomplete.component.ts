import {
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
import {
  IIngredient,
  IIngredientsGroup,
} from '../../recipes/models/ingredients';
import { IngredientService } from '../../recipes/services/ingredient.service';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SectionGroup {
  section: ISection;
  categories: ICategory[];
}

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  animations: [trigger('height', heightAnim())],
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
  @Output() groupEmitter = new EventEmitter<IIngredientsGroup>();
  @Input() startOnTyping = false;
  @Input() error: string = '';
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() group: SectionGroup[] = [];
  @Input() ingredients: IIngredient[] = [];
  @Input() max?: number | undefined = undefined;
  @Input() leaveValueAfterBlur = false;
  filterIngredients: IIngredient[] = [];
  @Input() ingredientsGroups: IIngredientsGroup[] = [];
  filterIngredientsGroups: IIngredientsGroup[] = [];
  @Input() sectionMode = false;
  @Input() clearValueOnBlur = false;

  @Input() anyData: string[] = [];
  filterAnyData: string[] = [];

  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)

  fullGroup: SectionGroup[] = [];
  autocompleteShow: boolean = false;
  categories: ICategory[] = [];
  sections: ISection[] = [];
  value = '';

  mySections: ISection[] = [];
  @Input() allSections: ISection[] = [];

  getFullGroup = false;

  get noAnySearchMatches() {
    switch (this.context) {
      case 'categories':
        return this.group.length === 0;
      case 'ingredients':
        return this.filterIngredients.length === 0;
      case 'groups':
        return this.filterIngredientsGroups.length === 0;
      case 'sections':
        return this.mySections.length === 0;
      case 'any':
        return this.filterAnyData.length === 0;
        return;
    }
  }

  constructor(
    private router: Router,
    private ingredientService: IngredientService,
  ) {}

  focus() {
    if (!this.value) {
      this.mySections = this.allSections;
      this.fullGroup = this.group;
      this.filterIngredientsGroups = this.ingredientsGroups;
      this.filterIngredients = this.ingredients;
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
      this.mySections = JSON.parse(JSON.stringify(this.allSections));
      this.filterIngredientsGroups = this.ingredientsGroups;
      this.filterAnyData = this.anyData;

      this.filterIngredients = this.ingredients;
      this.group = JSON.parse(JSON.stringify(this.fullGroup));
    }
    if (this.value !== '') {
      this.isFocused = true;
      this.isSleep = true;
    }
  }

  goToLink(link: string): void {
    this.router.navigateByUrl(link);
  }
  addCategory(listCategory: ICategory) {
    this.categoryEmitter.emit(listCategory);
    this.copyOfFullGroup();
  }
  addAny(any: string) {
    this.anyEmitter.emit(any);
       setTimeout(() => {
         this.filterAnyData = this.anyData;
       }, 300);
  }
  addSection(listSection: ISection) {
    this.sectionEmitter.emit(listSection);
    this.mySections = this.sections;
    setTimeout(() => {
      this.mySections = this.sections;
    }, 300);
  }
  addIngredientGroup(listIngredientGroup: IIngredientsGroup) {
    this.groupEmitter.emit(listIngredientGroup);
    setTimeout(() => {
      this.filterIngredientsGroups = this.ingredientsGroups;
    }, 300);
  }
  addIngredient(listIngredient: IIngredient) {
    this.ingredientEmitter.emit(listIngredient);

    if (this.leaveValueAfterBlur) {
      this.value = listIngredient.name;
      setTimeout(() => {
        this.filterIngredientsBySearchquery();
      }, 300);
    } else {
      this.value = '';
      setTimeout(() => {
        this.filterIngredients = this.ingredients;
      }, 300);
    }
    this.change();
  }
  copyOfFullGroup() {
    setTimeout(() => {
      this.group = JSON.parse(JSON.stringify(this.fullGroup));
    }, 300);
  }
  searchSections() {
    if (this.value !== '') {
      this.mySections = [];
      const search = this.value.toLowerCase().replace(/\s/g, '');
      const filterSections: ISection[] = [];
      const allSections: ISection[] = JSON.parse(
        JSON.stringify(this.allSections),
      );

      allSections.forEach((item: ISection) => {
        if (item.name.toLowerCase().replace(/\s/g, '').includes(search))
          filterSections.push(item);
      });

      filterSections.forEach((element) => {
        this.mySections.push(element);
      });
    } else {
      this.mySections = JSON.parse(JSON.stringify(this.allSections));
    }
  }

  searchIngredientsGroups() {
    if (this.value !== '') {
      this.filterIngredientsGroups = [];
      const search = this.value.toLowerCase().replace(/\s/g, '');
      const filterGroups: IIngredientsGroup[] = [];
      const allIngredients = this.ingredientsGroups;

      allIngredients.forEach((item: IIngredientsGroup) => {
        if (item.name.toLowerCase().replace(/\s/g, '').includes(search))
          filterGroups.push(item);
      });

      filterGroups.forEach((element) => {
        this.filterIngredientsGroups.push(element);
      });
    } else {
      this.filterIngredientsGroups = this.ingredientsGroups;
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
  filterIngredientsBySearchquery() {
    this.filterIngredients = [];
    const searchQuery = this.value.toLowerCase().replace(/\s/g, '');
    const filterIngredients: IIngredient[] = [];
    const allIngredients = [...this.ingredients];

    allIngredients.forEach((ingredient: IIngredient) => {
      const ingredientNames: string[] =
        this.ingredientService.getAllNamesOfIngredient(ingredient);
      if (ingredientNames.some((name) => name.includes(searchQuery))) {
        filterIngredients.push(ingredient);
      }
    });
    this.filterIngredients = [...filterIngredients];
  }

  searchIngredients() {
    if (this.value !== '') {
      if (
        (this.filterIngredients.length > 0 && this.startOnTyping) ||
        !this.startOnTyping
      )
        this.autocompleteShow = true;
      this.filterIngredientsBySearchquery();
      if (this.startOnTyping && this.filterIngredients.length === 0) {
        this.autocompleteShow = false;
      }
    } else {
      if (this.startOnTyping) {
        this.autocompleteShow = false;
      } else {
        this.filterIngredients = this.ingredients;
      }
    }
  }

  get context(): 'sections' | 'groups' | 'ingredients' | 'categories' | 'any' {
    if (this.sectionMode) return 'sections';
    if (this.ingredients.length > 0) return 'ingredients';
    if (this.ingredientsGroups.length > 0) return 'groups';
    if (this.anyData.length > 0) return 'any';
    return 'categories';
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
      case 'any':
        return 'По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска';
    }
    return `По вашему запросу нет никаких ${target}. Попробуйте изменить параметры поиска`;
  }

  searchCategories() {
    if (this.value !== '') {
      this.group = [];
      const search = this.value.toLowerCase().replace(/\s/g, '');
      const filterGroups: SectionGroup[] = [];
      const allGroup: SectionGroup[] = JSON.parse(
        JSON.stringify(this.fullGroup),
      );

      allGroup.forEach((itsGroup: SectionGroup) => {
        itsGroup.categories = itsGroup.categories.filter((element) => {
          if (element.name.toLowerCase().replace(/\s/g, '').includes(search))
            return true;
          else return false;
        });
        if (itsGroup.categories.length > 0) filterGroups.push(itsGroup);
      });

      filterGroups.forEach((element) => {
        this.group.push(element);
      });
    } else {
      this.group = JSON.parse(JSON.stringify(this.fullGroup));
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
