import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IComment, nullComment } from '../../../models/comments';
import { IRecipe, nullRecipe } from '../../../models/recipes';

@Component({
  selector: 'app-comments-list',
  templateUrl: './comments-list.component.html',
  styleUrls: ['./comments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsListComponent {
  @Input() comments: IComment[] = [];
  @Input() preloader = false;
  @Input() recipe: IRecipe = nullRecipe;

  preloaderComments: IComment[] = [
    {
      ...nullComment,
      id: -1,
      text: 'dfffffffffffffffffffffffffffffffffffffffffffffff',
      authorId: -1,
      date: 'fddfdfd',
    },
    {
      ...nullComment,
      id: -1,
      text: 'dfffffffffffffffffffffffffffffffffffffffffffffff',
      authorId: -1,
      date: 'fddfdfd',
    },
    {
      ...nullComment,
      id: -1,
      text: 'dfffffffffffffffffffffffffffffffffffffffffffffff',
      authorId: -1,
      date: 'fddfdfd',
    },
  ];
}
