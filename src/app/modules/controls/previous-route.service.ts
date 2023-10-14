import { Injectable } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter, pairwise } from 'rxjs/operators';
import { Location } from '@angular/common';

@Injectable()
export class RouteEventsService {
  public previousRoutePath = new BehaviorSubject<string>('');

  constructor(
    private router: Router,
    private location: Location,
  ) {
    this.previousRoutePath.next(this.location.path());
    this.router.events
      .pipe(
        filter((e) => e instanceof RoutesRecognized),
        pairwise(),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((event: any[]) => {
        this.previousRoutePath.next(event[0].urlAfterRedirects);
      });
  }
}
