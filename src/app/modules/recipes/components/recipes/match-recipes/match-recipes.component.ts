import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-match-recipes',
  templateUrl: './match-recipes.component.html',
  styleUrls: ['./match-recipes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class MatchRecipesComponent {}
