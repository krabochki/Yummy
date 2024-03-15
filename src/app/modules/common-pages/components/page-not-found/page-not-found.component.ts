import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['../../../authentication/common-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFoundComponent implements OnInit {
  constructor(private title: Title, private location:Location, private router:Router) {}
  ngOnInit() {
    this.title.setTitle('Страница не найдена');
    window.scrollTo(0, 0);
  }

  goToMain() {
    this.router.navigateByUrl('/');
  }
  goBack() {
    this.location.back();
  }
  get noPageToGoBack() {
    return window.history.length <= 1;
  }
}
