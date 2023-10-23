import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
})
export class RecipeListComponent {
  @Input() context: string = '';
  @Input() recipes: IRecipe[] = [];

  @HostListener('scroll', ['$event'])
  @ViewChild('list')
  list: ElementRef | null = null;

  

  scrollLeft() {
    if (this.list)
      this.list.nativeElement.scrollLeft -=
        this.list.nativeElement.scrollWidth / this.recipes.length;
  }

  scrollRight() {
    if (this.list)
      this.list.nativeElement.scrollLeft +=
        this.list.nativeElement.scrollWidth / this.recipes.length;
  }
}
