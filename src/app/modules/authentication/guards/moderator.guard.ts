import { Injectable, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class ModeratorGuard {
  constructor(@Inject(AuthService) private auth: AuthService,private router:Router) {}

  canActivate(): boolean {
    let role = 'user';
    this.auth.currentUser$.subscribe((data) => {
      role = data.role;
    });
    if (role === 'user') {
      this.router.navigateByUrl('/');
    }
    return role === 'admin' || role === 'moderator';
  }
}
