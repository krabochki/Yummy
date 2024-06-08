import { Component } from '@angular/core';
import { collections } from './consts';
import { Title } from '@angular/platform-browser';
@Component({
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent {
  protected collections = collections;
  constructor(private title: Title) {
    this.title.setTitle('Подборки')
  }
}
