import { Injectable, NgZone } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import {
  BehaviorSubject,
  Observable,
  throwError,
} from 'rxjs';
import { UserService } from '../../user-pages/services/user.service';
import { IRecipe } from '../../recipes/models/recipes';
import { usersUrl } from 'src/tools/source';
import { IIngredient } from '../../recipes/models/ingredients';
import { supabase, supabaseAdmin } from '../../controls/image/supabase-data';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  registerUser: IUser = { ...nullUser };

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>({ ...nullUser });
  currentUser$ = this.currentUserSubject.asObservable();

  users: IUser[] = [];
  uid = '';

  usersUrl = usersUrl;

  constructor(
    private userService: UserService,
    private router: Router,
    private ngZone: NgZone,
  ) {
    this.userService.users$.subscribe((users) => (this.users = users));
    //проверка состояния текущей сессии в реальном времени
    // supabase.auth.onAuthStateChange((event, session) => {
    //   //   if (event === 'SIGNED_IN')
    //   //     if (session?.user.email)
    //   //       this.loginUser({ ...nullUser, email: session?.user.email }).subscribe(
    //   //         (user) => {
    //   //           if (user) {
    //   //             this.setCurrentUser(user);
    //   //           }
    //   //         },
    //   //       );
    //   //   if (event === 'SIGNED_OUT') {
    //   //     this.logoutUser();
    //   //    this.ngZone.run(() => {
    //   //    });
    //   //   }
    //   // })
    // });
  }

  async passwordReset(email: string, users: IUser[]) {
    const resetUser = {
      ...nullUser,
      email: email,
    };
    try {
      const finded = users.find((u) => u.email === resetUser.email);

      if (!finded) {
        throwError;
      } else {
        await supabase.auth.resetPasswordForEmail(resetUser.email, {
          redirectTo: 'http://localhost:4200/password-reset',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        throwError;
      }
    }
  }

  loadCurrentUserData() {
    this.userService.users$.subscribe(() =>
      supabase.auth.onAuthStateChange((event, session) => {
        const user = { ...session?.user };
        if (user && user.email) {
          const iuser: IUser = {
            ...nullUser,
            email: user.email,
          };

          const loginUser = this.loginUser({ ...iuser });
          if (loginUser && loginUser.email === user.email) {
            this.currentUserSubject.next(loginUser);
          } else {
            this.currentUserSubject.next({ ...nullUser });
          }
        }
      }),
    );
  }

  async setCurrentUser(user: IUser) {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      this.uid = session?.user.id || '';
      this.currentUserSubject.next({ ...user });
    });
  }

  async supabaseLogin(user: IUser) {
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
  }

  register(user: IUser) {
    return supabase.auth.signUp({
      email: user.email,
      password: user.password,

      options: {
        emailRedirectTo: 'https://yummy-kitchen.vercel.app/welcome',
      },
    });
  }

  _session: Session | null = null;
  get session() {
    supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
    });

    return this._session;
  }

  profile(user: IUser) {
    return supabase.from('profiles').select(`*`).eq('id', user.id).single();
  }

  updateProfile(profile: IUser) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };

    return supabase.from('profiles').upsert(update);
  }

  deleteUserFromSupabase() {
    return supabaseAdmin.auth.admin.deleteUser(this.uid);
  }

  authChanges(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  getCurrentUser(): Observable<IUser> {
    return this.currentUserSubject.asObservable();
  }

  logoutUser() {
    this.setCurrentUser({ ...nullUser });
  }

  logout() {
    return supabase.auth.signOut();
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
    return this.users.length > 0
      ? this.users?.find((u) => u.email === user.email) || null
      : null;
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
