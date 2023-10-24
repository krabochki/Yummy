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

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private sectionService: SectionService,
    private cd:ChangeDetectorRef
  ) {}

  sections: ISection[] = [];
  categories: ICategory[] = [];
  isLoading = true;
  sectionSubscription?: Subscription;
  categoriesSubscription?: Subscription;

  filter: string = '';

  section: ISection = nullSection;

  title: string = '';

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.filter = data['filter'];
      this.section = data['SectionResolver'];

      

      if (this.filter === 'sections') {
        this.sectionSubscription = this.sectionService.sections$.subscribe(
          (sections: ISection[]) => {

            this.title='Все категории'
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
            const sect = { ...this.section }
            sect.name =''
            
            this.sections.push(sect); this.cd.markForCheck();

          },
        );
      }
      this.categoriesSubscription = this.categoryService.categories$.subscribe(
        (data) => {
          this.categories = data;
          this.categories.sort((category1: ICategory, category2: ICategory) =>
            category1.name > category2.name ? 1 : -1,
          );
          this.isLoading = false;                           this.cd.markForCheck();


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
    return sectionCategories;
  }

  ngOnDestroy() {
    this.categoriesSubscription?.unsubscribe();
    this.sectionSubscription?.unsubscribe();
  }
}
