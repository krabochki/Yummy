import { Component, HostListener, Input, OnInit } from '@angular/core';
import { IRecipe, nullRecipe } from '../../../models/recipes';

@Component({
  selector: 'app-vertical-recipe-list',
  templateUrl: './vertical-recipe-list.component.html',
  styleUrls: ['./vertical-recipe-list.component.scss'],
})
export class VerticalRecipeListComponent implements OnInit {
  @Input() blocks: IRecipe[] = []; // Передаваемый массив блоков

  nullRecipe: IRecipe = nullRecipe;

  ngOnInit() {
    this.onResize();
  }

  @Input() cols: number = 4;

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResize() {
    console.log('resize');
    const event = screen.width;

    if (this.cols === 4) {
      if (event <= 1200) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length % 3 !== 0) {
          while (this.blocks.length % 3 !== 0) {
            this.blocks.push(nullRecipe);
          }
        }
      }
      if (event <= 768) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length % 2 !== 0) {
          while (this.blocks.length % 2 !== 0) {
            this.blocks.push(nullRecipe);
          }
        }
      }
      if (event > 1200) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length % 4 !== 0) {
          while (this.blocks.length % 4 !== 0) {
            this.blocks.push(nullRecipe);
          }
        }
      }
      if (event > 768) {
        while (this.blocks.length === 2) this.blocks.push(nullRecipe);
      }
      if (event < 480) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length === 1) {
          this.blocks.push(nullRecipe);
        }
      }
    } else {
      if (event <= 900) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length % 2 !== 0) {
          while (this.blocks.length % 2 !== 0) {
            this.blocks.push(nullRecipe);
          }
        }
      }

      if (event > 900) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length % 3 !== 0) {
          while (this.blocks.length % 3 !== 0) {
            this.blocks.push(nullRecipe);
          }
        }
      }

      if (event < 480) {
        this.blocks = this.blocks.filter((block) => block.id !== 0);

        if (this.blocks.length === 1) {
          this.blocks.push(nullRecipe);
        }
      }
    }
  }
}
