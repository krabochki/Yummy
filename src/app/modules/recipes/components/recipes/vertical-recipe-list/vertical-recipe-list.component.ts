import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { IRecipe, nullRecipe } from '../../../models/recipes';

@Component({
  selector: 'app-vertical-recipe-list',
  templateUrl: './vertical-recipe-list.component.html',
  styleUrls: ['./vertical-recipe-list.component.scss'],
})
export class VerticalRecipeListComponent implements OnChanges {
  @Input() blocks: IRecipe[] = []; // Передаваемый массив блоков

  nullRecipe: IRecipe = nullRecipe;

  @Input() rowsNumberMobile = 1;

  @Input() moderMode = false;
  ngOnChanges() {
    this.onResize();
  }
  @Output() moderatorAction = new EventEmitter<number[]>();

  getModeratorAction(action: number[]) {
    this.moderatorAction.emit(action);
  }
  @Input() cols: number = 4;

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

  width:number =0
  @HostListener('window:resize', ['$event'])
  onResize() {
    const event = window.innerWidth;
    this.width=event

    if (this.cols === 4) {
      if (event <= 768 && event > 480) {
        this.blockScheme(2);
        return;
      } else if (event > 1200) {
        this.blockScheme(4);
        return;
      } else if (event > 768 && event <= 1200) {
        this.blockScheme(3);
        return;
      } else if (event <= 480) {
        this.filter();

        if (this.blocks.length === 1) {
          this.blocks.push(nullRecipe);
        }
        return;
      }
    } else {
      if (event <= 900 && event > 380) {
        this.blockScheme(2);
        return;
      } else if (event > 900) {
        this.blockScheme(3);
        return;
      } else if (event <= 480) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length === 1) {
          this.blocks.push(nullRecipe);
        }
      }
    }
  }
}
