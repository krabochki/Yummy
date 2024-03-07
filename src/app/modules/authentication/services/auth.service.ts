import { Injectable } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';
import { IRecipe } from '../../recipes/models/recipes';
import { IIngredient } from '../../recipes/models/ingredients';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { INotification } from '../../user-pages/models/notifications';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  private authUrl = 'http://localhost:3000/api';

  registerUser: IUser = { ...nullUser };

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>({ ...nullUser, init: false });
  private loadingSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(true);
  currentUser$ = this.currentUserSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  users: IUser[] = [];
  uid = '';

  constructor(
    private cookieService: CookieService,
    private http: HttpClient,
  ) {}

  isCurrentUserSaved(): string | null {
    const cookieValue = this.cookieService.get('token'); // To Get Cookie
    return cookieValue;
  }



  notifyUrl: string = 'http://localhost:3000/notifications';

  getNotificationsByUser(userId: number) {
    const url = `${this.notifyUrl}/${userId}`;
    return this.http.get<INotification[]>(url);
  }

  getModeratorsCount() {
    const url = `${this.authUrl}/moderators-count`;
    return this.http.get<number>(url);
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.authUrl}/forgot-password`, { email });
  }

  findUserByConfirmToken(token: string) {
    return this.http.get<IUser>(`${this.authUrl}/findUserByToken/${token}`);
  }

  findUserByResetToken(token: string) {
    return this.http.get<IUser>(
      `${this.authUrl}/findUserByResetToken/${token}`,
    );
  }

  getSomeModerators(limit: number, page: number) {
    const url = `${this.authUrl}/moderators?limit=${limit}&page=${page}`;
    return this.http.get<{ moderators: IUser[]; count: number }>(url);
  }

  findUserByDeleteToken(token: string) {
    return this.http.get<IUser>(
      `${this.authUrl}/findUserByDeleteToken/${token}`,
    );
  }

  // Функция для удаления токена у пользователя
  removeConfirmTokenFromUser(userId: number) {
    return this.http.put(`${this.authUrl}/removeTokenFromUser/${userId}`, {});
  }

  removeResetTokenFromUser(userId: number) {
    return this.http.put(
      `${this.authUrl}/removeResetTokenFromUser/${userId}`,
      {},
    );
  }
  removeDeleteTokenFromUser(userId: number) {
    return this.http.put(
      `${this.authUrl}/removeDeleteTokenFromUser/${userId}`,
      {},
    );
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.authUrl}/${userId}`);
  }
  deleteUserNotPublicRecipes(userId: number) {
    return this.http.delete(`${this.authUrl}/recipes/${userId}`);
  }
  changePassword(userId: number, password: string) {
    return this.http.put(`${this.authUrl}/change-password/${userId}`, {
      password: password,
    });
  }

  requestUserDeletion(userId: number, password: string) {
    return this.http.put(`${this.authUrl}/request-deletion/${userId}`, {
      password: password,
    });
  }

  secureChangePassword(
    userId: number,
    newPassword: string,
    oldPassword: string,
  ) {
    return this.http.put(`${this.authUrl}/change-password-secure/${userId}`, {
      newPassword: newPassword,
      oldPassword: oldPassword,
    });
  }

  loadCurrentUser(user: IUser) {
    user.init = true;
    if (user.id) {
      this.getNotificationsByUser(user.id).subscribe(
        (receivedNotifications: INotification[]) => {


          user.notifications = receivedNotifications;
          this.setCurrentUser(user);                  this.loadingSubject.next(false);

        },
      );
    } else {
      this.setCurrentUser(user);                  this.loadingSubject.next(false);

    }
  }

  setCurrentUser(user: IUser) {
    this.currentUserSubject.next(user);
  }

  postUser(user: IUser): Observable<IUser> {
    return this.http.post<IUser>(this.authUrl + '/register', user);
  }

  getCurrentUser(): Observable<IUser> {
    return this.currentUserSubject.asObservable();
  }

  logout() {
    const options = { withCredentials: true };
    return this.http.post(`${this.authUrl}/logout`, {}, options);
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

  getTokenUser(): Observable<IUser> {
    const options = { withCredentials: true };
    return this.http.get<IUser>(`${this.authUrl}/token-user`, options);
  }

  autologinUser(user: IUser) {
    const options = { withCredentials: true };
    return this.http.post(`${this.authUrl}/autologin`, user, options);
  }

  loginUser(user: IUser) {
    const options = { withCredentials: true };
    return this.http.post(`${this.authUrl}/login`, user, options);
  }
  changeToken(username: string) {
    const options = { withCredentials: true };
    return this.http.post(
      `${this.authUrl}/change-token`,
      { username: username },
      options,
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
  checkIngredientValidity(ingredient: IIngredient, user: IUser): boolean {
    return (
      (user.role === 'moderator' && ingredient.status === 'awaits') ||
      (user.role === 'admin' && ingredient.status === 'awaits') ||
      ingredient.status === 'public'
    );
  }
}
