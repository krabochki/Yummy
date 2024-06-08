import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
})
export class PlanningComponent implements OnInit {
  activePage: string = 'collections';

  constructor(private router: Router) { }
  getActivePage() {
    const currentUrl = this.router.url;
    switch (true) {
      case currentUrl.includes('shopping-list'):
        this.activePage = 'shopping-list';
        break;
      case currentUrl.includes('plan'):
        this.activePage = 'collections';
        break;
      default:
        this.activePage = 'main';
    }
  }
  
  ngOnInit() {
    this.getActivePage();
    
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.getActivePage()
      });
  }
}
