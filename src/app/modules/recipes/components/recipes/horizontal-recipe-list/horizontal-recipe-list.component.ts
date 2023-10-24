import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';

@Component({
  selector: 'app-horizontal-recipe-list',
  templateUrl: './horizontal-recipe-list.component.html',
  styleUrls: ['./horizontal-recipe-list.component.scss'],
})
export class HorizontalRecipeListComponent {
  @Input() recipes: IRecipe[] = [];
  @Input() showAuthor: boolean = true;

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
