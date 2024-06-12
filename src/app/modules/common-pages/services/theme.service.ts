import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { changeTheme } from 'src/tools/common';

export type themeUI = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  themeSubject = new BehaviorSubject<themeUI>('light');
  theme$ = this.themeSubject.asObservable();
  theme: themeUI = 'light';

  initializeTheme = false;

  constructor() {
    if (localStorage.getItem('theme') === 'dark') {
      this.changeTheme();
    }
    
    this.initializeTheme = true;

    this.theme$.subscribe((receivedTheme: themeUI) => {
      this.theme = receivedTheme;
      if (this.initializeTheme) { changeTheme(receivedTheme) }
    });
  }

  changeTheme() {
    this.themeSubject.next(this.theme === 'dark' ? 'light' : 'dark');
  }
}
