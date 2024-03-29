import { ChangeDetectionStrategy, Component, HostListener, Input, OnChanges, ViewChild } from '@angular/core';
import { DragScrollComponent } from 'ngx-drag-scroll';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { dragEnd, dragStart } from 'src/tools/common';

@Component({
  selector: 'app-horizontal-recipe-list',
  templateUrl: './horizontal-recipe-list.component.html',
  styleUrls: ['./horizontal-recipe-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorizontalRecipeListComponent implements OnChanges {
  @Input() recipes: IRecipe[] = [];
  @Input() showAuthor: boolean = true;

  loading = true;

  disableDrag = false;
  @ViewChild('nav', { read: DragScrollComponent }) ds?: DragScrollComponent;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.disableDrag = window.innerWidth < 480;
  }
  ngOnChanges() {
    this.onResize();
  }

  scrollLeft() {
    this.ds?.moveLeft();
  }

  dragStart() {
    dragStart();
  }

  dragEnd() {
    dragEnd();
  }

  scrollRight() {
    this.ds?.moveRight();
  }
}
