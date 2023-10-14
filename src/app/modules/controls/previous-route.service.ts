import { Injectable } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter, pairwise } from 'rxjs/operators';
import { Location } from '@angular/common';

@Injectable()
export class RouteEventsService {
  // save the previous route
  public previousRoutePath = new BehaviorSubject<string>('');

  constructor(
    private router: Router,
    private location: Location,
  ) {
    // ..initial prvious route will be the current path for now
    this.previousRoutePath.next(this.location.path());

    // on every route change take the two events of two routes changed(using pairwise)
    // and save the old one in a behavious subject to access it in another component
    // we can use if another component like intro-advertise need the previous route
    // because he need to redirect the user to where he did came from.
    this.router.events
      .pipe(
        filter((e) => e instanceof RoutesRecognized),
        pairwise(),
      )
      .subscribe((event: any[]) => {
        this.previousRoutePath.next(event[0].urlAfterRedirects);
      });
  }
}
