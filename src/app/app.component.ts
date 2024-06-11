import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { AuthService } from './modules/authentication/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { getErrorDescription, getErrorHeader } from 'src/tools/error.handler';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  loading = true;
  gif = 'preloader-light.gif';
  error?: HttpErrorResponse;

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.authService.error$.subscribe((error) => {
      if (error) {
        this.error = error;
        this.cd.markForCheck();
      }
    });
    this.authService.loading$.subscribe((loading) => {
      this.loading = loading;
      this.cd.markForCheck();
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

  errorInfo() {
    return `status ${this.error?.status} ${this.error?.statusText}`;
  }

  spaceUnderHeaderHeight: number = 0;
  reloadPage(): void {
    // Перезагрузить страницу
    window.location.reload();
  }

  getErrorHeader(status: number) {
    return getErrorHeader(status);
  }

  getErrorDescription(status: number) {
    return getErrorDescription(status);
  }

  getHeaderHeight(headerHeight: number) {
    this.spaceUnderHeaderHeight = headerHeight;
    this.cd.markForCheck();
  }
}
