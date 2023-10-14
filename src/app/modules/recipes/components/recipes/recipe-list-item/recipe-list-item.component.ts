import { Component, Input, OnInit } from '@angular/core';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';

@Component({
  selector: 'app-recipe-list-item',
  templateUrl: './recipe-list-item.component.html',
  styleUrls: ['./recipe-list-item.component.scss'],
})
export class RecipeListItemComponent implements OnInit {
  @Input() recipe?: IRecipe | undefined;

  likes?: number = 0;
  cooks?: number = 0;

  ngOnInit() {
    this.likes = this.recipe?.likesId.length;
    this.cooks = this.recipe?.cooksId.length;
  }
}
