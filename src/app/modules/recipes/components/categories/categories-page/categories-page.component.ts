import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CategoryService } from '../../../services/category.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { Subscription, timeout } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SectionService } from '../../../services/section.service';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import { RecipeService } from '../../../services/recipe.service';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
  animations: [trigger('auto-complete', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private sectionService: SectionService,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private recipeService: RecipeService,
  ) {}

  sections: ISection[] = [];
  categories: ICategory[] = [];
  isLoading = true;
  sectionSubscription?: Subscription;
  categoriesSubscription?: Subscription;

  filter: string = '';

  section: ISection = nullSection;
  searchQuery: string = '';
  autocompleteShow: boolean = false;
  autocomplete: any[] = [];
  title: string = '';

  popularCategories: ICategory[] = [];

  categoriesForPopular: ICategory[] = [];

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.categoriesSubscription = this.categoryService.categories$.subscribe(
        (data) => {
          this.categories = data;

          this.recipeService.recipes$.subscribe((recipes) => {
            this.popularCategories = this.categoryService.getPopularCategories(
              this.categories,
              recipes,
            );
          });
          this.cd.markForCheck();
        },
      );

      this.filter = data['filter'];
      this.section = data['SectionResolver'];

      if (this.filter === 'sections') {
        this.sectionSubscription = this.sectionService.sections$.subscribe(
          (sections: ISection[]) => {
            this.title = 'Разделы';
            this.titleService.setTitle(this.title);
            this.sections = sections;

            this.sections.sort((elem1: ISection, elem2: ISection) => {
              if (elem1.name > elem2.name) {
                return 1;
              } else {
                return -1;
              }
            });
            this.cd.markForCheck();
          },
        );
      } else if (this.filter === 'popular') {
        this.sectionSubscription = this.sectionService.sections$.subscribe(
          () => {
            this.sections = [];
            this.title = 'Популярные категории';
            this.titleService.setTitle(this.title);

            const popularCategories = this.popularCategories;
            this.categoriesForPopular = popularCategories;
            const popularCategoriesIds: number[] = [];
            console.log(popularCategories);
            popularCategories.forEach((element) => {
              popularCategoriesIds.push(element.id);
            });
            const popularSection: ISection = {
              name: '',
              categoriesId: popularCategoriesIds,
              id: -1,
              photo: '',
            };
            this.sections.push(popularSection);
            console.log(popularSection);
            this.cd.markForCheck();
          },
        );
      } else {
        this.sectionSubscription = this.sectionService.sections$.subscribe(
          () => {
            this.sections = [];
            this.title = this.section.name;
            this.titleService.setTitle(this.title);

            const sect = { ...this.section };
            sect.name = '';

            this.sections.push(sect);
            this.cd.markForCheck();
          },
        );
      }
      if (this.filter !== 'popular') {
        this.categories.sort((category1: ICategory, category2: ICategory) =>
          category1.name > category2.name ? 1 : -1,
        );
      }
      if (this.filter !== 'sections') {
        this.categoriesToShow = this.getCategoriesOfSection(this.section).slice(0,8);
      }
      this.isLoading = false;
    });
  }

  categoriesToShow:ICategory[]=[]

  loadMoreCategories() {
    const currentLength = this.categoriesToShow.length;
    const nextRecipes = this.getCategoriesOfSection(this.section).slice(
      currentLength,
      currentLength + 8,
    );
    this.categoriesToShow = [...this.categoriesToShow, ...nextRecipes];
  }
  getCategoriesOfSection(section: ISection): ICategory[] {
    let sectionCategories: ICategory[] = [];

    if (this.filter === 'popular') {
      sectionCategories = this.categoriesForPopular;
    } else {
      this.categories.forEach((category) => {
        if (section.categoriesId.includes(category.id)) {
          sectionCategories.push(category);
        }
      });
    }

    return sectionCategories;
  }
  getSectionOfCategory(category: ISection): ISection {
    if (!category.categoriesId) {
      return this.sectionService.getSectionOfCategory(this.sections, category);
    }
    return nullSection;
  }

  ngOnDestroy() {
    this.categoriesSubscription?.unsubscribe();
    this.sectionSubscription?.unsubscribe();
  }

  turnOffSearch() {
    this.searchQuery = '';
  }

  blurSearch() {
    setTimeout(() => {
      this.autocompleteShow = false;
    }, 300);
  }

  focusSearch() {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }
  turnOnSearch() {
    this.autocompleteShow = true;
    if (this.searchQuery.length > 0) {
      this.autocomplete = [];
      const notEmptySections = this.sectionService.getNotEmptySections(
        this.sections,
      );
      const filterSections: ISection[] = notEmptySections.filter(
        (section: ISection) =>
          section.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
      const filterCategories: ICategory[] = this.categories.filter(
        (category: ICategory) =>
          category.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
      filterCategories.forEach((filterCategory) => {
        this.autocomplete.push(filterCategory);
      });
      filterSections.forEach((filterSection) => {
        this.autocomplete.push(filterSection);
      });
    } else this.autocompleteShow = false;
  }
}
