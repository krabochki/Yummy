import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  templateUrl: './anonim.component.html',
  styleUrls: ['../../authentication/common-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonimPageComponent implements OnInit {
  constructor(private title:Title){}
  ngOnInit() {
    this.title.setTitle('Доступ запрещен')
    window.scrollTo(0, 0);
  }
}
