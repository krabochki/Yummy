import { Injectable, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { IUser } from '../../user-pages/models/users';

@Injectable()
export class AdminGuard {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    private router: Router,
  ) {}

  canActivate() {
    let role = 'user';

    return this.auth.getTokenUser().pipe(
      tap((user: IUser) => {
        role = user.role;

        if (!role ||  role === 'user') {
          this.router.navigateByUrl('/');
        }
        return role === 'admin';
      }),
    );
  }
}
