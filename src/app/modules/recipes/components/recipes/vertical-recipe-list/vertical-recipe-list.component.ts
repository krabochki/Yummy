import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnChanges,
} from '@angular/core';
import { IRecipe, nullRecipe } from '../../../models/recipes';

@Component({
  selector: 'app-vertical-recipe-list',
  templateUrl: './vertical-recipe-list.component.html',
  styleUrls: ['./vertical-recipe-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalRecipeListComponent implements OnChanges {
  @Input() blocks: IRecipe[] = []; // Передаваемый массив блоков

  nullRecipe: IRecipe = nullRecipe;

  @Input() rowsNumberMobile = 1;

  @Input() moderMode = false;
  ngOnChanges() {
    this.onResize();
  }

  @Input() cols: number = 4;
  @Input() showAuthor: boolean = true;

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

  width: number = 0;
  @HostListener('window:resize', ['$event'])
  onResize() {
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
  }
}
