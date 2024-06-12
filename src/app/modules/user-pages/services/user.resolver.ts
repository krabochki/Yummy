import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from './user.service';
import { IUser, nullUser } from '../models/users';
import { AuthService } from '../../authentication/services/auth.service';

@Injectable({ providedIn: 'root' })
export class UserResolver implements Resolve<IUser> {
  currentUser: IUser = nullUser;
  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.authService.currentUser$.subscribe(
      (data) => (this.currentUser = data),
    );
  }

  resolve(route: ActivatedRouteSnapshot): Observable<IUser> {
    const userId = Number(route.params['id']);

    if (userId <= 0) {
      this.router.navigate(['/cooks']);
      return EMPTY;
    }

    return this.userService.getUser(userId).pipe(
      map((user: IUser
        ) => {
        if (user) {
          return user;
        } else {
          throw new Error('Пользователь не найден');
        }
      }),
      catchError(() => {
        this.router.navigate(['/cooks']);
        return EMPTY;
      }),
    );

  }
}