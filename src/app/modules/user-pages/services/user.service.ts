import { Injectable } from '@angular/core';
import { IRecipe } from '../../recipes/models/recipes';
import { RecipeService } from '../../recipes/services/recipe.service';
import { IUser } from '../models/users';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users: IUser[] = [];

  constructor(private http: HttpClient) {}

  url: string = 'http://localhost:3000/users';

  isUserSubscriber(user: any,userId: any) {
      return user?.followersIds?.includes(userId);

  }

  getUsers() {
    return this.http.get<IUser[]>(this.url);
  }

  getUser(id: number) {
    return this.http.get<IUser>(`${this.url}/${id}`);
  }
}
