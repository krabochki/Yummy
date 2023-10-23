import { Injectable, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { IUser, nullUser } from '../../user-pages/models/users';

@Injectable()
export class OnlyNoAuthGuard {
  constructor(@Inject(AuthService) private auth: AuthService) {}

  canActivate(): boolean {
    let user: IUser = {...nullUser};
    this.auth.currentUser$.subscribe((data) => {
      user = data;
    });
    return user.id === 0;
  }
}
