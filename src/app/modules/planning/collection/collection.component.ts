import { Component } from '@angular/core';
import { collections } from './consts';
@Component({
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent {
  protected collections = collections;
}
