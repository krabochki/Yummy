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

    return this.userService.users$.pipe(
      map((users: IUser[]) => {
        const foundUser = users.find((user) => {
          if (user.id === userId) return true;
          else return false;
        });

        //не показываем страницу если пользователь это запретил(но показываем если это сам пользователь на нее перешел или модератор/админ)
        if (foundUser) {
          if (
            ((!this.userService.getPermission('show-my-page', foundUser) &&
            this.currentUser.id !== foundUser.id )
            && (this.currentUser.role === 'user' || foundUser.role === 'admin'))
          ) {
              throw new Error('anonimous');
          }
          else {
           return foundUser;
          }
        } else {
          throw new Error('nouser');
        }
      }),
      catchError((e: Error) => {
        if (e.message === 'anonimous') {
          this.router.navigate(['/access-denied']);
        } else {
          this.router.navigate(['/cooks']);
        }
        return EMPTY;
      }),
    );
  }
}
