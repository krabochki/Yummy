import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IGroup } from '../models/ingredients';
import { GroupService } from '../services/group.service';

@Injectable({ providedIn: 'root' })
export class GroupResolver implements Resolve<IGroup> {
  constructor(
    private groupService: GroupService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IGroup> {
    const id = Number(route.params['id']);

    if (id <= 0) {
      this.router.navigate(['/groups']);
      return EMPTY;
    }

    return this.groupService.getShortGroup(id).pipe(
      map((response: any) => {
        const group = response[0];
        if (group) {
          return group;
        } else {
          throw new Error('Группа не найдена');
        }
      }),
      catchError(() => {
        this.router.navigate(['/groups']);
        return EMPTY;
      }),
    );
  }
}
