import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  ngOnInit() {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      localStorage.setItem('theme', 'light');
    }
  }

  spaceUnderHeaderHeight: number = 0;

  getHeaderHeight(headerHeight: number) {
    this.spaceUnderHeaderHeight = headerHeight;
  }
}
