import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListComponent {
  @Input() recipes?: IRecipe[];
}
