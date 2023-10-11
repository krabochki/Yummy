import { Injectable, Inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AdminGuard  {
  constructor(@Inject(AuthService) private auth: AuthService) {}

  canActivate(
  ): boolean {
    return this.auth.role == 'admin';
  }

}
