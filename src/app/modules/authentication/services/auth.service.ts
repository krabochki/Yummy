import { Injectable, NgZone } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { UserService } from '../../user-pages/services/user.service';
import { IRecipe } from '../../recipes/models/recipes';
import { IIngredient } from '../../recipes/models/ingredients';
import { supabase, supabaseAdmin } from '../../controls/image/supabase-data';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { state } from 'src/tools/state';

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

  constructor(
    private userService: UserService,
    private router: Router,
    private ngZone: NgZone,
   
  ) {
  }

  setOnline(user: IUser) {
    user = { ...user, online: true };
    return this.userService.updateUserInSupabase(user);
  }
  setOffline(user: IUser) {
    user = { ...user, online: false };
    return this.userService.updateUserInSupabase(user);
  }

  // supabase.auth.onAuthStateChange((event, session) => {
  //   if (event === 'SIGNED_IN')
  //     if (session?.user.email) {
  //       const user = { ...session?.user };
  //       if (user && user.email) {
  //         const iuser: IUser = {
  //           ...nullUser,
  //           email: user.email,
  //         };
  //         const loginUser = this.loginUser({ ...iuser });
  //         if (loginUser && loginUser.email === user.email) {
  //           this.currentUserSubject.next(loginUser);
  //         } else {
  //           this.currentUserSubject.next({ ...nullUser });
  //         }
  //       }
  //     }

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
        await supabase.auth.resetPasswordForEmail(resetUser.email, {});
      }
    } catch (error) {
      if (error instanceof Error) {
        throwError;
      }
    }
  }
  loadCurrentUserData() {
    this.userService.users$.subscribe((users) => {
            this.users = users;

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          this.handleAuthStateChange(session);
        }
       
      });
    });
  }

  handleAuthStateChange(session: Session | null) {
    const user = { ...session?.user };
    if (user && user.email) {
      this.loadUserFromSupabaseByEmail(user.email, true)
        .then((loadedUser) => {
          if (loadedUser) {
            const user = this.userService.translateUser(loadedUser);
            this.currentUserSubject.next(user);

          } else {
            this.currentUserSubject.next({ ...nullUser });
          }
        })
        .catch((error) => {
          console.error('Error loading user from Supabase:', error);
        });
    }
  }

  loginUserWithToken(hash: string) {
    const urlSearchParams = new URLSearchParams(hash);
    const accessToken = urlSearchParams.get('access_token');
    const refreshToken = urlSearchParams.get('refresh_token');
    if (accessToken && refreshToken) {
      return supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else return false;
  }

  async setCurrentUser(user: IUser) {
    await supabase.auth.getSession().then(({ data }) => {
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
        emailRedirectTo:
          state === 'dev'
            ? 'http://localhost:4200/#/welcome'
            : 'https://yummy-kitchen.vercel.app/#/welcome',
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
      ? this.users?.find(
          (u) => u.email === user.email || u.username === user.username,
        ) || null
      : null;
  }

  async loadUserFromSupabaseByEmail(
    email: string,
    full?: boolean,
  ): Promise<number | null> {
    return supabase
      .from('profiles')
      .select(full ? '*' : 'id')
      .eq('email', email)
      .then((response) => {
        if (response.data) {
          const res = response.data[0];
          if (!full)
            if (res.id) {
              return res.id;
            } else {
              return null;
            }
          else {
            if (res) return res;
            else return null;
          }
        } else {
          return null;
        }
      });
  }

  async getUserByEmail(email: string) {
    const user = await this.loadUserFromSupabaseByEmail(email);
    return user;
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
