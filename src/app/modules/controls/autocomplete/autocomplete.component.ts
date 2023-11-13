import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ICategory, ISection } from '../../recipes/models/categories';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import {
  IIngredient,
  IIngredientsGroup,
} from '../../recipes/models/ingredients';
import { IngredientService } from '../../recipes/services/ingredient.service';

export interface SectionGroup {
  section: ISection;
  categories: ICategory[];
}

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  animations: [trigger('height', heightAnim())],
})
export class AutocompleteComponent implements OnChanges {
  @Output() categoryEmitter = new EventEmitter<ICategory>();
  @Output() sectionEmitter = new EventEmitter<ISection>();
  @Output() ingredientEmitter = new EventEmitter<IIngredient>();
  @Output() groupEmitter = new EventEmitter<IIngredientsGroup>();

  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() group: SectionGroup[] = [];
  @Input() ingredients: IIngredient[] = [];
  filterIngredients: IIngredient[] = [];
  @Input() ingredientsGroups: IIngredientsGroup[] = [];
  filterIngredientsGroups: IIngredientsGroup[] = [];
  @Input() sectionMode = false;

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
    }
  }

  constructor(
    private router: Router,
    private ingredientService: IngredientService,
  ) {}

  ngOnChanges() {
    this.mySections = this.allSections;
    this.fullGroup = this.group;
    this.filterIngredientsGroups = this.ingredientsGroups;
    this.filterIngredients = this.ingredients;
  }

  focus() {
    this.autocompleteShow = true;
    this.isFocused = true;
    this.isSleep = false;
  }

  blur() {
    this.autocompleteShow = false;
    this.isFocused = false;
    if (this.value != '') {
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
    setTimeout(() => {
      this.filterIngredients = this.ingredients;
    }, 300);
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

  searchIngredients() {
    if (this.value !== '') {
      this.filterIngredients = [];
      const searchQuery = this.value.toLowerCase().replace(/\s/g, '');
      const filterIngredients: IIngredient[] = [];
      const allIngredients = this.ingredients;

      allIngredients.forEach((ingredient: IIngredient) => {
        const ingredientNames: string[] =
          this.ingredientService.getAllNamesOfIngredient(ingredient);
        if (ingredientNames.some((name) => name.includes(searchQuery))) {
          filterIngredients.push(ingredient);
        }
      });

      filterIngredients.forEach((ingredient) => {
        this.filterIngredients.push(ingredient);
      });
    } else {
      this.filterIngredients = this.ingredients;
    }
  }

  get context(): 'sections' | 'groups' | 'ingredients' | 'categories' {
    if (this.sectionMode) return 'sections';
    if (this.ingredients.length > 0) return 'ingredients';
    if (this.ingredientsGroups.length > 0) return 'groups';
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
    }
  }
}
