import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
} from '@angular/core';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { RecipeService } from '../../../services/recipe.service';

@Component({
  selector: 'app-vertical-recipe-list',
  templateUrl: './vertical-recipe-list.component.html',
  styleUrls: ['./vertical-recipe-list.component.scss'],
})
export class VerticalRecipeListComponent implements OnChanges, OnInit {
  @Input() blocks: IRecipe[] = []; // Передаваемый массив блоков
  @Input() rowsNumberMobile = 1;
  @Input() cols: number = 4;
  @Input() moderMode = false;
  @Input() preloader = false;
  @Input() showAuthor: boolean = true;
  width: number = 0;

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (!this.preloader) {
      const event = window.innerWidth;
      this.width = event;

      switch (this.cols) {
        case 4:
          switch (true) {
            case event <= 768 && event > 480:
              this.blockScheme(2);
              break;
            case event > 1200:
              this.blockScheme(4);
              break;
            case event > 768 && event <= 1200:
              this.blockScheme(3);
              break;
            case event <= 480:
              this.filter();
              if (this.blocks.length === 1) {
                this.blocks.push(nullRecipe);
              }
              break;
          }
          break;
        default:
          switch (true) {
            case event <= 900 && event > 480:
              this.blockScheme(2);
              break;
            case event > 900:
              this.blockScheme(3);
              break;
            case event <= 480:
              this.filter();
              if (this.blocks.length === 1) {
                this.blocks.push(nullRecipe);
              }
              break;
          }
          break;
      }
    } else {
      this.preloaderScheme();
    }
  }

  constructor(
    private recipeService: RecipeService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnChanges() {
    if (!this.preloader) {
      this.onResize();
    }
  }

  ngOnInit() {
  
    if (this.preloader) {
      this.preloaderScheme();
    }
  }

  preloaderScheme() {
    const width = window.innerWidth;
    this.blocks = [];
    let blocks = 0;

    switch (this.cols) {
      case 4:
        switch (true) {
          case width <= 768:
            blocks = 4;
            break;
          case width > 1200:
            blocks = 8;
            break;
          case width > 768 && width <= 1200:
            blocks = 6;
            break;
        }
        break;
      default:
        switch (true) {
          case width <= 900:
            blocks = 2;
            break;

          case width > 900:
            blocks = 3;
            break;
        }
        break;
    }

    const loadingRecipe = { ...nullRecipe, id: -1 };
    for (let index = 0; index < blocks; index++) {
      this.blocks.push(loadingRecipe);
    }
  }

  filter() {
    this.blocks = this.blocks.filter((block) => block.id !== 0);
  }

  blockScheme(blocksInRow: number) {
    this.filter();
    if (this.blocks.length % blocksInRow !== 0) {
      while (this.blocks.length % blocksInRow !== 0) {
        this.blocks.push(nullRecipe);
      }
    }
  }
}
