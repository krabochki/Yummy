import { Injectable, Inject } from "@angular/core";
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable()
export class AdminGuard
    implements CanActivate, CanActivateChild {
    constructor(
        @Inject(AuthService) private auth: AuthService
    ) {


    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {

        return this.auth.role=='admin';
    }

    canActivateChild(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {

        return this.auth.role=='admin';
    }
}