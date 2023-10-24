import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CategoryService } from '../../../services/category.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SectionService } from '../../../services/section.service';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
  animations: [trigger('auto-complete', heightAnim())],
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private sectionService: SectionService,
    private cd: ChangeDetectorRef,
    private titleService:Title
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

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.filter = data['filter'];
      this.section = data['SectionResolver'];

      if (this.filter === 'sections') {
        this.sectionSubscription = this.sectionService.sections$.subscribe(
          (sections: ISection[]) => {
            this.title = 'Разделы';
            this.titleService.setTitle(this.title)
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
      this.categoriesSubscription = this.categoryService.categories$.subscribe(
        (data) => {
          this.categories = data;
          this.categories.sort((category1: ICategory, category2: ICategory) =>
            category1.name > category2.name ? 1 : -1,
          );
          this.isLoading = false;
          this.cd.markForCheck();
        },
      );
    });
  }
  getCategoriesOfSection(section: ISection): ICategory[] {
    const sectionCategories: ICategory[] = [];
    this.categories.forEach((category) => {
      if (section.categoriesId.includes(category.id)) {
        sectionCategories.push(category);
      }
    });
    if (this.filter !== 'sections') {
      this.categories = sectionCategories;
    }
    return sectionCategories;
  }
  getSectionOfCategory(category: ISection): ISection {
    if (!category.categoriesId) {
      return this.sectionService.getSectionOfCategory(this.sections, category)
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
    if (this.searchQuery !== '') {
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
    } else this.blurSearch();
  }
}
