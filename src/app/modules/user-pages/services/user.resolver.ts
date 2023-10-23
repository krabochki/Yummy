import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from './user.service';
import { IUser } from '../models/users';

@Injectable({ providedIn: 'root' })
export class UserResolver implements Resolve<IUser> {
  constructor(
    private userService: UserService,
    private router: Router,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IUser> {
    const userId = Number(route.params['id']);

    if (userId <= 0) {
      this.router.navigate(['cooks']);
      return EMPTY;
    }

    return this.userService.users$.pipe(
      map((users: IUser[]) => {
        const foundUser = users.find((user) => {
          if (user.id === userId) return true;
          else return false;
        });
        if (foundUser) { return foundUser; }
        else {
          throw new Error('Пользователь не найден')
        }
      }),
      catchError(() => {
        this.router.navigate(['cooks']);
        return EMPTY;
      }),
    );
  }
}
