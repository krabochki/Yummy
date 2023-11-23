import { Injectable } from '@angular/core';
import { IUser, nullUser } from '../../user-pages/models/users';
import { BehaviorSubject, EMPTY, Observable, filter, map, take } from 'rxjs';
import { UserService } from '../../user-pages/services/user.service';
import { IRecipe } from '../../recipes/models/recipes';
import { usersUrl } from 'src/tools/source';
import { IIngredient } from '../../recipes/models/ingredients';
import { supabase, supabaseAdmin } from '../../controls/image/supabase-data';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  role = 'user';

  registerUser: IUser = { ...nullUser };

  private currentUserSubject: BehaviorSubject<IUser> =
    new BehaviorSubject<IUser>({ ...nullUser });
  currentUser$ = this.currentUserSubject.asObservable();

  uid = '';

  usersUrl = usersUrl;

  constructor(private userService: UserService) {}

  loadCurrentUserData() {
    this.userService.users$.subscribe(() => {
      const user = this.session?.user;

      if (user?.email) {
        const iuser: IUser = {
          ...nullUser,
          email: user?.email,
        };

        this.loginUser(iuser).subscribe((user) => {
          if (user) {
            this.setCurrentUser(user);
          }
        });
      }
    });
  }

  async setCurrentUser(user: IUser) {
    this.supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      this.uid = session?.user.id || '';
      this.currentUserSubject.next({ ...user });
    });
  }

  supabase = supabase;

  async supabaseLogin(user: IUser) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
  }

  _session: Session | null = null;
  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
    });

    return this._session;
  }

  profile(user: IUser) {
    return this.supabase
      .from('profiles')
      .select(`*`)
      .eq('id', user.id)
      .single();
  }

  updateProfile(profile: IUser) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };

    return this.supabase.from('profiles').upsert(update);
  }

   deleteUserFromSupabase() {
  return supabaseAdmin.auth.admin.deleteUser(this.uid);
  }

  authChanges(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
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
    localStorage.removeItem('currentUser');
  }

  logout() {
    return this.supabase.auth.signOut();
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
        return users.length > 0
          ? users?.find((u) => u.email === user.email) || null
          : null;
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
  checkIngredientValidity(ingredient: IIngredient, user: IUser): boolean {
    return (
      (user.role === 'moderator' && ingredient.status === 'awaits') ||
      (user.role === 'admin' && ingredient.status === 'awaits') ||
      ingredient.status === 'public'
    );
  }
}
