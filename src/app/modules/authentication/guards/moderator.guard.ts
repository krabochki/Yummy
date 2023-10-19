import { Injectable, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ModeratorGuard {
  constructor(@Inject(AuthService) private auth: AuthService) {}

  canActivate(): boolean {
    let role = 'user';
    this.auth.getCurrentUser().subscribe((data) => {
      role = data.role;
    });
    return role === 'admin' || role === 'moderator';
  }
}
