import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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

    return this.sectionService.sections$.pipe(
      switchMap((sections: ISection[]) => {
        const foundSection: ISection | undefined = sections.find(
          (section) => section.id === sectionId,
        );
        if (foundSection) {
          return of(foundSection);
        } else {
          this.router.navigate(['/sections']);
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