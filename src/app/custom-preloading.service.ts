import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { flatMap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class CustomPreloadingService implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    if (route.data && route.data['preload']) {
      const delay: number = route.data['delay'];
      return timer(delay).pipe(
        flatMap((_) => {
          return fn();
        }),
      );
    } else {
      return of(null);
    }
  }
  constructor() {}
}
