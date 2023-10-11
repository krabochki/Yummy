import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { Subscription } from 'rxjs';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListComponent {
  @Input() recipes?: IRecipe[];

  constructor() {}
}
