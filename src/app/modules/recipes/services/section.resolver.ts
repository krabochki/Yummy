import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SectionService } from './section.service';
import { ISection } from '../models/categories';

@Injectable({ providedIn: 'root' })
export class SectionResolver implements Resolve<ISection> {
  constructor(
    private sectionService: SectionService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ISection> {
    const sectionId = Number(route.params['id']);

    if (sectionId <= 0) {
      this.router.navigate(['/sections']);
      return EMPTY;
    }

      return this.sectionService.getSection(sectionId, 'user').pipe(
        map((section: ISection) => {
          if (section) {
            return section;
          } else {
            throw new Error('Секция не найдена');
          }
        }),
        catchError(() => {
          this.router.navigate(['/sections']);
          return EMPTY;
        }),
      );

  }
}