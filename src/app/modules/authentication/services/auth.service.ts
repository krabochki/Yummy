import { Injectable } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';
import { IRecipe } from '../../recipes/models/recipes';
import { IIngredient } from '../../recipes/models/ingredients';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { INotification } from '../../user-pages/models/notifications';
import { apiSource } from '../../../../tools/sourses';
import { notificationsSource } from '../../../../tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  private authUrl = apiSource;

  registerUser: IUser = { ...nullUser };

  private dashboardOpenedSource = new BehaviorSubject<boolean>(false);
  dashboardOpened$ = this.dashboardOpenedSource.asObservable();

  setDashboardOpened(isOpened: boolean) {
    this.dashboardOpenedSource.next(isOpened);
  }

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>({ ...nullUser });
  loadingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  errorSubject: BehaviorSubject<HttpErrorResponse | undefined> =
    new BehaviorSubject<HttpErrorResponse | undefined>(undefined);
  currentUser$ = this.currentUserSubject.asObservable();
  error$ = this.errorSubject.asObservable();
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

  notifyUrl: string = notificationsSource;

  getNotificationsByUser(userId: number) {
    const url = `${this.notifyUrl}/${userId}`;
    return this.http.get<INotification[]>(url);
  }

  getModeratorsCount() {
    const options = { withCredentials: true };

    const url = `${this.authUrl}/moderators-count`;
    return this.http.get<number>(url, options);
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.authUrl}/forgot-password`, { email });
  }

  findUserByConfirmToken(token: string) {
    return this.http.get<IUser>(`${this.authUrl}/findUserByToken/${token}`);
  }

  findUserByResetToken(token: string) {
    const options = { withCredentials: true };

    return this.http.get<number>(
      `${this.authUrl}/findUserByResetToken/${token}`,
      options,
    );
  }

  deleteExpiredUsers() {
    const options = { withCredentials: true };
    const url = `${this.authUrl}/expired`;
    return this.http.delete(url, options);
  }

  getSomeModerators(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.authUrl}/moderators?limit=${limit}&page=${page}`;
    return this.http.get<{ moderators: IUser[]; count: number }>(url, options);
  }

  changePassword(userId: number, password: string, resetToken: string) {
    return this.http.put(`${this.authUrl}/change-password/${userId}`, {
      password: password,
      resetToken: resetToken,
    });
  }
  getManagerActionsCount() {
    const options = { withCredentials: true };

    const url = `${this.authUrl}/manager-actions-count`;
    return this.http.get<number>(url, options);
  }

  secureChangePassword(newPassword: string, oldPassword: string) {
    const options = { withCredentials: true };

    return this.http.put(
      `${this.authUrl}/change-password-secure`,
      {
        newPassword: newPassword,
        oldPassword: oldPassword,
      },
      options,
    );
  }

  loadCurrentUser(user: IUser) {
    if (user.id) {
      this.setCurrentUser(user);
      this.loadingSubject.next(false);
    } else {
      this.setCurrentUser(user);
      this.loadingSubject.next(false);
    }
  }

  setCurrentUser(user: IUser) {
    this.currentUserSubject.next(user);
  }

  postUser(user: IUser) {
    return this.http.post(this.authUrl + '/register', user);
  }

  getCurrentUser(): Observable<IUser> {
    return this.currentUserSubject.asObservable();
  }
  getExpiredUsersCount() {
    const options = { withCredentials: true };
    const url = `${this.authUrl}/expired-count`;
    return this.http.get<number>(url, options);
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

  getUserIdBySiteToken(siteToken: string) {
    return this.http.post(`${this.authUrl}/site-token`, { siteToken });
  }

  verifyUser(userId: number, code: number) {
    return this.http.get(`${this.authUrl}/verify-user/${userId}/${code}`);
  }

  loginUser(user: IUser) {
    const options = { withCredentials: true };
    return this.http.post(`${this.authUrl}/login`, user, options);
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
