import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IComment } from '../../../models/comments';
import { IRecipe, nullRecipe } from '../../../models/recipes';

@Component({
  selector: 'app-comments-list',
  templateUrl: './comments-list.component.html',
  styleUrls: ['./comments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentsListComponent {
  @Input() comments: IComment[] = [];
  @Input() recipe: IRecipe = nullRecipe;
 

}
