import { Injectable, Inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { IUser, nullUser } from "../../user-pages/models/users";
import { Router } from "@angular/router";

@Injectable()
export class AuthGuard
      {
    constructor(
        @Inject(AuthService) private auth: AuthService,private router:Router
    ) {}

    canActivate(
    ): boolean {
      let user: IUser = {...nullUser};
        this.auth.currentUser$.subscribe((data) => {
          user = data;
        });
      if (user.id === 0) {
        this.router.navigateByUrl('/');
      }
        return user.id !== 0;
    }

}