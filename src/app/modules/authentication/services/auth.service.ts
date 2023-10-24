import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import { BehaviorSubject, Observable, catchError, map } from 'rxjs';
import { RecipeService } from '../../recipes/services/recipe.service';
import { UserService } from '../../user-pages/services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>(nullUser);

  usersUrl = 'http://localhost:3000/users';

  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
    private userService: UserService,
  ) {
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      const currentUser: IUser = JSON.parse(savedUser);
      this.userService.getUsers().subscribe((users) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteUser(userId: number): Observable<any> {
    const url = `${this.usersUrl}/${userId}`;
    this.recipeService.deleteDataAboutDeletingUser(userId);
    this.userService.deleteDataAboutDeletingUser(userId);
    return this.http.delete(url);
  }

  logoutUser() {
    this.setCurrentUser(nullUser);
    localStorage.removeItem('currentUser');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerUser(newUser: IUser): Observable<any> {
    return this.http.post(this.usersUrl, newUser);
  }

  isUserExist(user: IUser) {
    this.http.get<IUser[]>(this.usersUrl).pipe(
      map((users) => {
        const foundUser = users.find(
          (u) =>
            u.email === user.email &&
            u.password === user.password &&
            u.username === user.username,
        );
        if (!foundUser) return false;
        return true;
      }),
    );
  }
  loginUser(user: IUser) {
    return this.http.get<IUser[]>(this.usersUrl).pipe(
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
}
