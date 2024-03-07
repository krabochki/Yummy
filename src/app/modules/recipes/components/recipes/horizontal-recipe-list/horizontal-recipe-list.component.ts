import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DragScrollComponent } from 'ngx-drag-scroll';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { dragEnd, dragStart } from 'src/tools/common';
import { RecipeService } from '../../../services/recipe.service';

@Component({
  selector: 'app-horizontal-recipe-list',
  templateUrl: './horizontal-recipe-list.component.html',
  styleUrls: ['./horizontal-recipe-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorizontalRecipeListComponent implements OnChanges, OnInit {
  @Input() recipes: IRecipe[] = [];
  @Input() preloader = false;
  @Input() showAuthor: boolean = true;
  @ViewChild('nav', { read: DragScrollComponent }) ds?: DragScrollComponent;

  showScrollButtons = true;
  disableDrag = false;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.disableDrag = window.innerWidth < 480;
  }

  constructor(
    private recipeService: RecipeService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (this.preloader) {
      const width = window.innerWidth;

      this.showScrollButtons = false;
      this.recipes = [];
      let blocks = 0;

      switch (true) {
        case width <= 768:
          blocks = 2;
          break;
        case width > 1200:
          blocks = 4;
          break;
        case width > 768 && width <= 1200:
          blocks = 3;
          break;
      }

      const loadingRecipe = { ...nullRecipe, id: -1 };
      for (let index = 0; index < blocks; index++) {
        this.recipes.push(loadingRecipe);
      }

      return;
    }
    this.recipeService.recipes$.subscribe(() => {
      this.cd.markForCheck();
      this.cd.detectChanges();
    });
  }

  ngOnChanges() {
    this.onResize();
  }

  scrollLeft() {
    this.ds?.moveLeft();
  }

  scrollRight() {
    this.ds?.moveRight();
  }

  dragStart() {
    dragStart();
  }

  dragEnd() {
    dragEnd();
  }
}
