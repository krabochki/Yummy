import {
  Router,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, of, catchError, EMPTY } from 'rxjs';
import { IUser } from '../models/users';
import { UserService } from './user.service';
import { AuthService } from '../../authentication/services/auth.service';

@Injectable({ providedIn: 'root' })
export class UserResolver {
  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
  ) {}


     currentUser?: IUser | null ;

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<IUser> {

    

    if (route.params?.['id'] == 'null') {
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
