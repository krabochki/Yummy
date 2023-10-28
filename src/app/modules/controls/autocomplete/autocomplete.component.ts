import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { CategoryService } from '../../recipes/services/category.service';
import { SectionService } from '../../recipes/services/section.service';
import { Subject, takeUntil } from 'rxjs';
import {
  ICategory,
  ISection,
  nullSection,
} from '../../recipes/models/categories';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim } from 'src/tools/animations';

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
  isSleep: boolean = false; //подсвечивается ли плейсхолдер
  isFocused = false; //есть ли фокус в инпуте (нужно ли подсвечивать плейсхолдер)
  @Input() placeholder: string = '';
  @Input() group: SectionGroup[] = [];
  fullGroup: SectionGroup[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();
  autocompleteShow: boolean = false;

  constructor(
    private router: Router
  ) {}
  categories: ICategory[] = [];
  sections: ISection[] = [];
  value = '';

  getFullGroup = false;

  ngOnChanges() {
    if (!this.getFullGroup) {
      this.fullGroup = this.group;
      this.getFullGroup = true;
    }
   
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
  }
  copyOfFullGroup() {
   setTimeout(() => {

     this.group = JSON.parse(JSON.stringify(this.fullGroup));

   }, 300);
  }

  search() {
    if (this.value !== '') {
      this.group = [];
      const search = this.value.toLowerCase().replace(/\s/g, '');
      const filterGroups: SectionGroup[] = [];
      const allGroup: SectionGroup[] = JSON.parse(JSON.stringify(this.fullGroup));




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
}
