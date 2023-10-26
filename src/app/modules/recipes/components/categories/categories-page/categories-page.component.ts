import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CategoryService } from '../../../services/category.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { ActivatedRoute, Router } from '@angular/router';
import { SectionService } from '../../../services/section.service';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import { RecipeService } from '../../../services/recipe.service';
import { Subject, takeUntil } from 'rxjs';
import { IRecipe } from '../../../models/recipes';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
  animations: [trigger('auto-complete', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  sections: ISection[] = [];
  categories: ICategory[] = [];
  isLoading = true;

  filter: string = '';

  section: ISection = nullSection;
  searchQuery: string = '';
  autocompleteShow: boolean = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autocomplete: any[] = [];
  title: string = '';
  categoriesToShow: ICategory[] = [];

  popularCategories: ICategory[] = [];

  categoriesForPopular: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,

    private sectionService: SectionService,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private recipeService: RecipeService,
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.categoryService.categories$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data: ICategory[]) => {
          this.categories = data;

          this.recipeService.recipes$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((recipes: IRecipe[]) => {
              this.popularCategories =
                this.categoryService.getPopularCategories(
                  this.categories,
                  recipes,
                );
            });
          this.cd.markForCheck();
        });

      this.filter = data['filter'];
      this.section = data['SectionResolver'];

      if (this.filter === 'sections') {
        this.sectionService.sections$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((sections: ISection[]) => {
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
          });
      } else if (this.filter === 'popular') {
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
      } else {
        this.sections = [];
        this.title = this.section.name;
        this.titleService.setTitle(this.title);

        const sect = { ...this.section };
        sect.name = '';

        this.sections.push(sect);
        this.cd.markForCheck();
      }
      if (this.filter !== 'popular') {
        this.categories.sort((category1: ICategory, category2: ICategory) =>
          category1.name > category2.name ? 1 : -1,
        );
      }
      if (this.filter !== 'sections') {
        this.categoriesToShow = this.getCategoriesOfSection(this.section).slice(
          0,
          10,
        );
      }
      this.isLoading = false;
    });
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link)
  }

  loadMoreCategories() {
    const currentLength = this.categoriesToShow.length;
    const nextRecipes = this.getCategoriesOfSection(this.section).slice(
      currentLength,
      currentLength + 5,
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

  turnOffSearch() {
    this.searchQuery = '';
  }

  blurSearch() {
      this.autocompleteShow = false;
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
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
