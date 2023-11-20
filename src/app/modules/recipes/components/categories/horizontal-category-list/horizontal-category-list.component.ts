import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnChanges, ViewChild } from '@angular/core';
import { DragScrollComponent } from 'ngx-drag-scroll';
import { ICategory, ISection, nullCategory, nullSection } from 'src/app/modules/recipes/models/categories';
import { dragEnd, dragStart } from 'src/tools/common';

@Component({
  selector: 'app-horizontal-category-list',
  templateUrl: './horizontal-category-list.component.html',
  styleUrls: ['./horizontal-category-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorizontalCategoryListComponent implements OnChanges {
  @Input() categories: any[] = [];
  @Input() showRecipesNumber: boolean = false;

  @ViewChild('list')
  list: ElementRef | null = null;
  @Input() context: 'category' | 'section' = 'category';



  showScrollButtons = true;



  filterNullBlocks() {
    this.categories = this.categories.filter((block) => block.id !== 0);
  }

  disableDrag = false;
  @ViewChild('nav', { read: DragScrollComponent }) ds?: DragScrollComponent;


  ngOnChanges() {
    this.onResize();
  }

  dragStart(): void{
    if(this.showScrollButtons)
      dragStart()
  }

  dragEnd(): void{
    if (this.showScrollButtons)
      dragEnd();
  }

  scrollLeft() {
    this.ds?.moveLeft();
  }

  scrollRight() {
    this.ds?.moveRight();
  }

  //фиктивные блоки для случая если их меньше чем длина блоков в строке(чтобы не было пустого пространства) и проверка нужны для кнопки скролла
  blockScheme(blocksInRow: number) {
    if (window.innerWidth > 1400 && this.categories.length < 6) {
      this.showScrollButtons = false;
    }
    switch (true) {
      case window.innerWidth > 1400 && this.categories.length < 6:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 960 &&
        window.innerWidth <= 1400 &&
        this.categories.length < 5:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 700 &&
        window.innerWidth <= 960 &&
        this.categories.length < 4:
        this.showScrollButtons = false;
        break;
      case window.innerWidth > 480 &&
        window.innerWidth <= 700 &&
        this.categories.length < 3:
        this.showScrollButtons = false;
        break;
      default:
        this.showScrollButtons = true;
    }

    this.filterNullBlocks();
    if (this.categories.length < blocksInRow) {
      while (this.categories.length < blocksInRow) {
        this.categories.push(nullSection);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
        this.disableDrag = window.innerWidth < 480;

    const event = window.innerWidth;
    switch (true) {
      case event < 480:
        this.filterNullBlocks();
        if (this.categories.length <= 2)
          while (this.categories.length !== 3)
            this.categories.push(nullSection);
        break;
      case event > 480 && event <= 700:
        this.blockScheme(2);
        break;
      case event > 700 && event <= 960:
        this.blockScheme(3);
        break;
      case event > 960 && event <= 1400:
        this.blockScheme(4);
        break;
      case event > 1400:
        this.blockScheme(5);
        break;
    }
  }
}
