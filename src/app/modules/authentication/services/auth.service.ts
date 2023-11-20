import { Injectable } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import { BehaviorSubject, EMPTY, Observable, filter, map, take } from 'rxjs';
import { UserService } from '../../user-pages/services/user.service';
import { IRecipe } from '../../recipes/models/recipes';
import { usersUrl } from 'src/tools/source';
import { IIngredient } from '../../recipes/models/ingredients';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>({ ...nullUser });
  currentUser$ = this.currentUserSubject.asObservable();

  usersUrl = usersUrl;

  constructor(private userService: UserService) {}

  loadCurrentUserData() {
    this.userService.users$.subscribe((users) => {
      const savedUser = localStorage.getItem('currentUser');

      if (savedUser) {
        const currentUser: IUser = JSON.parse(savedUser);
        if (currentUser && currentUser.id > 0) {
          const foundUser = users.find(
            (u) =>
              u.email === currentUser.email &&
              u.password === currentUser.password,
          );
          if (foundUser) {
            this.setCurrentUser(foundUser);
          }
        }
      }
    });
  }

  setCurrentUser(user: IUser): void {
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
      map((users) =>
        users.length > 0
          ? users?.find(
              (u) =>
                (u.email === user.email && u.password === user.password) ||
                (u.username === user.username && u.password === user.password),
            ) || null
          : null,
      ),
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
