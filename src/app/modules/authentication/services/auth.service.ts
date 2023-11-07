import { Injectable } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  map,
} from 'rxjs';
import { UserService } from '../../user-pages/services/user.service';
import { IRecipe } from '../../recipes/models/recipes';
import { usersUrl } from 'src/tools/source';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>({ ...nullUser });
  currentUser$ = this.currentUserSubject.asObservable();

  usersUrl =  usersUrl

  constructor(
    private userService: UserService,
  ) {
    
    

    this.userService.users$.subscribe((users) => {
      const savedUser = localStorage.getItem('currentUser');

      if (savedUser) {
        const currentUser: IUser = JSON.parse(savedUser);
        if (currentUser && currentUser.id > 0) {

          const foundUser=users.find(u=> u.email===currentUser.email&&u.password===currentUser.password)
          if (foundUser) {
            this.setCurrentUser(foundUser);
            console.log(
              'Автоматический вход в аккаунт пользователя ' +
              currentUser.username +
              ' выполнен успешно!',
            );
          }
        }
        
      }
    })
  }

  setCurrentUser(user: IUser) {
    this.currentUserSubject.next({ ...user });

  }

  getCurrentUser(): Observable<IUser> {
    return this.currentUserSubject.asObservable();
  }

  logoutUser() {
    this.setCurrentUser({ ...nullUser });
    localStorage.removeItem('currentUser');
  }

  isEmailExist(users: IUser[], email: string): boolean {
    const userWithThisEmail = users.find((u) => u.email === email);
    if (userWithThisEmail) return true;
    else return false;
  }
  isUsernameExist(users: IUser[], username: string): boolean {
    const userWithThisUsername = users.find((u) => u.username === username);
    if (userWithThisUsername) return true;
    else return false;
  }

  loginUser(user: IUser) {
    
    
    return this.userService.users$.pipe(
      map((users) => {
        if (users.length > 0) {
          const foundUser = users.find(
            (u) =>
              (u.email === user.email && u.password === user.password) ||
              (u.username === user.username && u.password === user.password),
          );
          if (!foundUser) return null;
          return foundUser;
        }
        else return null
      }),
    );
  }

  checkValidity(recipe: IRecipe, user: IUser): boolean {
    return (
      recipe.authorId === user.id ||
      (user.role === 'moderator' && recipe.status === 'awaits') ||
      (user.role === 'admin' && recipe.status === 'awaits') ||
      recipe.status === 'public'
    );
  }
}
