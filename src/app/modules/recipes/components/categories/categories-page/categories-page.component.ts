import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../../services/category.service';
import { ICategory, ISection } from '../../../models/categories';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
})
export class CategoriesPageComponent implements OnInit {
  constructor(private categoryService: CategoryService) {}

  sections: ISection[] = [];
  categories: ICategory[] = [];
  isLoading = true;

  ngOnInit() {
    this.categoryService.getSections().subscribe((data) => {
      this.sections = data;
      this.sections.sort((elem1: ISection, elem2: ISection) => {
        if (elem1.name > elem2.name) {
          return 1;
        } else {
          return -1;
        }
      });
      this.categoryService.getCategories().subscribe((data) => {
        this.categories = data;
        this.categories.sort((elem1: ICategory, elem2: ICategory) => {
          if (elem1.name > elem2.name) {
            return 1;
          } else {
            return -1;
          }
        });
                  this.isLoading = false;

      });
    });
  }
  getCategories(section: ISection): ICategory[] {
    const categoriesToReturn: ICategory[] = [];
    this.categories.forEach((element) => {
      if (section.categoriesId.includes(element.id)) {
        categoriesToReturn.push(element);
      }
    });
    return categoriesToReturn;
  }
}
