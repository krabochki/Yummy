import {
  Router,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, catchError, EMPTY } from 'rxjs';
import { IUser, nullUser } from '../models/users';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class UserResolver {
  constructor(
    private userService: UserService,
    private router: Router,
  ) {}


     currentUser: IUser = nullUser  ;

  resolve (
    route: ActivatedRouteSnapshot,
  ): Observable<IUser> {

    

    if (route.params?.['id'] === '0') {
             return EMPTY;
      
    }
    return this.userService.getUser(route.params?.['id']).pipe(
      catchError(() => {
        this.router.navigate(['cooks']);
        return EMPTY;
      }),
    );
  }
}