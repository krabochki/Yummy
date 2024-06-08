import { Injectable, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { IUser } from '../../user-pages/models/users';
import { Router } from '@angular/router';
import {  tap } from 'rxjs';

@Injectable()
export class OnlyNoAuthGuard {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    private router: Router,
  ) {}

  canActivate() {
    return this.auth.getTokenUser().pipe(
      tap((user: IUser) => {
        if (user.id !== 0) {
          this.router.navigateByUrl('/');
        }
        return user.id === 0;
      }),
    );
  }
}
