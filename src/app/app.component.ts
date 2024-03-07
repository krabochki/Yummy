import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AuthService } from './modules/authentication/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  loading = true;
  gif = 'preloader-light.gif';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.loading$.subscribe((loading) => {
      this.loading = loading;
    });
    const favicon = document.querySelector('#favicon');

    if (localStorage.getItem('theme') === 'dark') {
      this.gif = 'preloader-dark.gif';
      document.body.classList.add('dark-mode');
      favicon?.setAttribute('href', '/assets/images/chef-day.png');
    } else {
      localStorage.setItem('theme', 'light');
      favicon?.setAttribute('href', '/assets/images/chef-night.png');
    }
  }

  spaceUnderHeaderHeight: number = 0;

  getHeaderHeight(headerHeight: number) {
    this.spaceUnderHeaderHeight = headerHeight;
  }
}
