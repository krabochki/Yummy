import { Injectable, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { IUser } from '../../user-pages/models/users';

@Injectable()
export class OnlyNoAuthGuard {
  constructor(@Inject(AuthService) private auth: AuthService) {}

  canActivate(): boolean {
    let user: IUser = {
      email: '',
      password: '',
      username: '',
      role: 'user',
      avatarUrl: '',
      description: '',
      quote: '',
      fullName: '',
      followersIds: [],
      socialNetworks: [],
      personalWebsite: '',
      location: '',
      registrationDate: '',
      profileViews: 0,
      id: 0,
    };
    this.auth.getCurrentUser().subscribe(
      (data) => {
        user = data;
      }
    )
    return user.id === 0;
  }
}
