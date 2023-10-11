import { Injectable, Inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { IUser } from "../../user-pages/models/users";

@Injectable()
export class AuthGuard
      {
    constructor(
        @Inject(AuthService) private auth: AuthService
    ) {}

    canActivate(
    ): boolean {
        let user: IUser | null = null;
        this.auth.getCurrentUser().subscribe((data) => {
          user = data;
        });
        return user != null;
    }

}