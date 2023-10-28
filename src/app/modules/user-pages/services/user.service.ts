import { Injectable } from '@angular/core';
import { IUser } from '../models/users';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, switchMap, take, tap, throwError } from 'rxjs';
import { usersUrl } from 'src/tools/source';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersSubject = new BehaviorSubject<IUser[]>([]);
  users$ = this.usersSubject.asObservable();
  url: string = usersUrl;

  constructor(private http: HttpClient) {
 
  }

  loadUsersData() {
    this.getUsers().subscribe((data) => {
      this.usersSubject.next(data);
    });
  }

  isUserSubscriber(user: IUser, userId: number) {
    if (!user) return false;
    return user?.followersIds?.includes(userId);
  }
  getFollowers(users: IUser[], userId: number): IUser[] {
    const user = users.find((user: IUser) => user.id === userId);
    const followersIds = user?.followersIds;

    if (followersIds) {
      const followers = users.filter((user: IUser) =>
        followersIds.includes(user.id),
      );
      return followers;
    } else {
      return [];
    }
  }
  getFollowing(users: IUser[], userId: number): IUser[] {
    const following: IUser[] = [];
    users.forEach((user: IUser) => {
      user.followersIds?.forEach((follower: number) => {
        if (follower === userId) {
          following.push(user);
        }
      });
    });

    return following;
  }

  getUsers() {
    return this.http.get<IUser[]>(this.url);
  }

  deleteDataAboutDeletingUser(deletingId: number) {
    let users: IUser[] = [];
    this.users$.subscribe((data) => {
      users = data;
      users.forEach((user) => {
        if (user.followersIds.includes(deletingId)) {
          user.followersIds = user.followersIds?.filter(
            (element) => element !== deletingId,
          );
          this.updateUsers(user);
        }
      });
    });
  }

  addFollower(user: IUser, followerId: number): IUser {
    if (user && user.followersIds) {
      if (!user.followersIds.includes(followerId)) {
        user.followersIds.push(followerId);
      }
    }
    return user;
  }
  removeFollower(user: IUser, followerId: number) {
    if (user && user.followersIds) {
      const followerIndex = user.followersIds.indexOf(followerId);
      if (followerIndex !== -1) {
        user.followersIds.splice(followerIndex, 1);
      }
    }
    return user;
  }

  updateUsers(user: IUser) {
    const url = `${this.url}/${user.id}`;

    return this.http
      .put<IUser>(url, user)
      .pipe(
        switchMap((updatedUser) => {
          // Обновление пользователей внутри Observable
          return this.usersSubject.pipe(
            take(1), // Берем только одно значение и отписываемся
            map((currentUsers) => {
              const index = currentUsers.findIndex(
                (r) => r.id === updatedUser.id,
              );
              if (index !== -1) {
                const updatedUsers = [...currentUsers];
                updatedUsers[index] = updatedUser;
                this.usersSubject.next(updatedUsers); // Обновляем Subject
              }
              return updatedUser; // Возвращаем обновленного пользователя
            }),
          );
        }),
        catchError((error) => {
          // Обработка ошибки, если необходимо
          return throwError(error);
        }),
      )
  }

  updateUser(user: IUser) {
    return this.http.put<IUser>(`${this.url}/${user.id}`, user);
  }

  deleteUser() {
    //исправить: не удаляет юзера и выдает ошибки если у него более 1 своего рецепта
    // this.deleteDataAboutDeletingUser(deletableUser.id);
    // this.recipeService.deleteDataAboutDeletingUser(deletableUser.id);
    // return this.http
    //   .delete(`${this.url}/${deletableUser.id}`)
    //   .pipe(
    //     tap((answer) =>
    //       this.usersSubject.next(
    //         this.usersSubject.value.filter(
    //           (user) => user.id !== deletableUser.id,
    //         ),
    //       ),
    //     ),
    //   )
    //   .subscribe();
  }

  postUser(user: IUser) {
    return this.http
      .post<IUser>(this.url, user)
      .pipe(
        tap((newUser: IUser) => {
          const currentUsers = this.usersSubject.value;
          const updatedUsers = [...currentUsers, newUser];
          this.usersSubject.next(updatedUsers);
        }),
      )
  }
}
