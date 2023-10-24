import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import {
  BehaviorSubject,
  Observable,
  map,
} from 'rxjs';
import { RecipeService } from '../../recipes/services/recipe.service';
import { UserService } from '../../user-pages/services/user.service';
import { IRecipe } from '../../recipes/models/recipes';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>({ ...nullUser });
  currentUser$ = this.currentUserSubject.asObservable();

  usersUrl = 'http://localhost:3000/users';

  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
    private userService: UserService,
  ) {
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      const currentUser: IUser = JSON.parse(savedUser);
      this.userService.users$.subscribe((users) => {
        const foundUser = users.find(
          (u) =>
            u.email === currentUser.email &&
            u.password === currentUser.password &&
            u.username === currentUser.username,
        );
        if (foundUser) {
          this.setCurrentUser(currentUser);
          console.log(
            'Автоматический вход в аккаунт пользователя ' +
              currentUser.username +
              ' выполнен успешно!',
          );
        } else {
          console.log('Такого пользователя не существует');
        }
      });
    } else {
      console.log('Пользователь не был сохранен в локальном хранилище');
    }
  }

  setCurrentUser(user: IUser) {
    this.currentUserSubject.next(user);
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
        const foundUser = users.find(
          (u) =>
            (u.email === user.email && u.password === user.password) ||
            (u.username === user.username && u.password === user.password),
        );
        if (!foundUser) return null;
        return foundUser;
      }),
    );
  }

  checkValidity(recipe: IRecipe, user: IUser): boolean {
    return (
      recipe.authorId === user.id ||
      user.role === 'moderator' ||
      user.role === 'admin' ||
      recipe.status === 'public'
    );
  }
}
