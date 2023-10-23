import { Component, OnDestroy, OnInit } from '@angular/core';
import { CategoryService } from '../../../services/category.service';
import { ICategory, ISection } from '../../../models/categories';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  constructor(private categoryService: CategoryService) {}

  sections: ISection[] = [];
  categories: ICategory[] = [];
  isLoading = true;
  sectionSubscription?: Subscription;
  categoriesSubscription?: Subscription;

  ngOnInit() {
    this.sectionSubscription = this.categoryService.sections$.subscribe(
      (data) => {
        this.sections = data;
        this.sections.sort((elem1: ISection, elem2: ISection) => {
          if (elem1.name > elem2.name) {
            return 1;
          } else {
            return -1;
          }
        });
        this.categoriesSubscription =
          this.categoryService.categories$.subscribe((data) => {
            this.categories = data;
            this.categories.sort(
              (category1: ICategory, category2: ICategory) =>
                category1.name > category2.name ? 1 : -1,
            );
            this.isLoading = false;
          });
      },
    );
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
