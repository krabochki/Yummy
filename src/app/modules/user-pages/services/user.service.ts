import { Injectable } from '@angular/core';
import { IUser } from '../models/users';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users: IUser[] = [];

  constructor(private http: HttpClient) {}

  url: string = 'http://localhost:3000/users';

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
  getFollowing(users: IUser[], userId: number): IUser[]  {
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
    this.getUsers().subscribe((data) => {
      users = data;

      users.forEach((user) => {
        const before = user.followersIds;
        user.followersIds = user.followersIds?.filter(
          (element) => element != deletingId,
        );
        if (before !== user.followersIds) {
          this.updateUser(user).subscribe();
        }
      });
    });
  }

  getUser(id: number) {
    return this.http.get<IUser>(`${this.url}/${id}`);
  }
  addFollower(user: IUser, followerId: number) {
    if (user && user.followersIds) {
      if (!user.followersIds.includes(followerId)) {
        user.followersIds.push(followerId);
        return user;
      }
    }
    return;
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

  updateUser(user: IUser) {
    return this.http.put<IUser>(`${this.url}/${user.id}`, user);
  }
}
