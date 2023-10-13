import { Component } from '@angular/core';
import { RouteEventsService } from '../controls/route-events.service';

@Component({
  selector: 'app-user-pages',
  templateUrl: './user-pages.component.html',
  styleUrls: ['./user-pages.component.scss']
})
export class UserPagesComponent {
  constructor(
    private routeEventsService: RouteEventsService
  ){}
}
