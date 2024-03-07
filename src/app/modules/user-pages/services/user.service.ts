import { Injectable } from '@angular/core';
import { IUser } from '../models/users';
import { BehaviorSubject, Observable, finalize, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  usersSubject = new BehaviorSubject<IUser[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  setUsers(users: IUser[]) {
    this.usersSubject.next(users);
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

  public followUser(follower: number, following: number) {
    const url = `${this.usersUrl}/subscribe`;
    const body = { follower, following };
    return this.http.post(url, body);
  }

  public unfollowUser(follower: number, following: number) {
    const url = `${this.usersUrl}/unsubscribe`;
    const body = { follower, following };
    return this.http.post(url, body);
  }

  incrementProfileViews(userId: number) {
    const url = `${this.usersUrl}/profile-views`;
    return this.http.put(url, { userId });
  }

  getManagersShort() {
    const url = `${this.usersUrl}/managers-short`;
    return this.http.get(url);
  }

  getAllShort() {
    const url = `${this.usersUrl}/all-short`;
    return this.http.get(url);
  }

  getAllUsersBySearch(search: string) {
    const url = `${this.usersUrl}/search/all?search=${search}`;
    return this.http.get(url);
  }

  getManagersBySearch(search: string) {
    const url = `${this.usersUrl}/search/managers?search=${search}`;
    return this.http.get(url);
  }

  getMostViewedBySearch(search: string) {
    const url = `${this.usersUrl}/search/most-viewed?search=${search}`;
    return this.http.get(url);
  }

  getFollowingsBySearch(search: string, userId: number) {
    const url = `${this.usersUrl}/search/followings/${userId}?search=${search}`;
    return this.http.get(url);
  }

  getNearbyBySearch(search: string, userId: number) {
    const url = `${this.usersUrl}/search/nearby/${userId}?search=${search}`;
    return this.http.get(url);
  }

  getMostProductiveBySearch(search: string, userId: number) {
    const url = `${this.usersUrl}/search/productive/${userId}?search=${search}`;
    return this.http.get(url);
  }
  getPopularBySearch(search: string) {
    const url = `${this.usersUrl}/search/popular?search=${search}`;
    return this.http.get(url);
  }

  public getUserForEdit(userId: number): Observable<IUser> {
    const url = `${this.usersUrl}/edit/${userId}`;
    return this.http.get<IUser>(url);
  }
  updateUserpic(userId: number, filename: string) {
    const url = `${this.usersUrl}/userpic/${userId}`;
    return this.http.put(url, { image: filename });
  }
  public getUserFollowing(userId: number): Observable<number[]> {
    const url = `${this.usersUrl}/following/${userId}`;
    return this.http.get<number[]>(url);
  }

  public postLimitation(userId: number, context: string) {
    const url = `${this.usersUrl}/limitations/${userId}`;
    return this.http.post(url, { limitation: context });
  }
  public deleteLimitation(userId: number, context: string) {
    const url = `${this.usersUrl}/limitations/${userId}?limitation=${context}`;
    return this.http.delete(url);
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

  usersUrl = 'http://localhost:3000/users';

  updateUserProperty(
    userId: number,
    property:
      | 'username'
      | 'image'
      | 'description'
      | 'quote'
      | 'fullName'
      | 'socialNetworks'
      | 'personalWebsite'
      | 'locatiion'
      | 'permissions'
      | 'exclusions'
      | 'permanent'
      | 'emoji'
      | 'role'
      | 'birthday',
    value: any,
  ): Observable<any> {
    const url = `${this.usersUrl}/${userId}/${property}`;
    return this.http.put(url, { value });
  }

  updatePublicUser(userId: number, user: IUser) {
    const url = `${this.usersUrl}/public/${userId}`;
    return this.http.put<IUser>(url, user);
  }

  downloadUserpic(filename: string) {
    const fileUrl = `${this.usersUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  deleteUserpic(filename: string): Observable<any> {
    const url = `${this.usersUrl}/files/${filename}`;
    return this.http.delete(url);
  }

  uploadUserpic(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('avatar', file, file.name);

    return this.http.post<any>(`${this.usersUrl}/userpic`, formData);
  }

  getAvatar(user: IUser) {
    if (user.image) {
      this.setLoadingToUser(user.id, true);
      this.downloadUserpic(user.image)
        .pipe(
          tap((blob) => {
            this.setImageToUser(user.id, URL.createObjectURL(blob));
          }),
          finalize(() => {
            this.setLoadingToUser(user.id, false);
          }),
        )
        .subscribe();
    }
  }

  getPermission(limitations: string[], permission: string) {
    return !limitations?.find((limitation) => limitation === permission);
  }

  getLimitation(userId: number, permission: string) {
    const url = `${this.usersUrl}/limitation/${userId}?limitation=${permission}`;
    return this.http.get<boolean>(url);
  }

  public getFollowersIds(userId: number): Observable<number[]> {
    const url = `${this.usersUrl}/followersIds/${userId}`;
    return this.http.get<number[]>(url);
  }
  public getLimitations(userId: number): Observable<string[]> {
    const url = `${this.usersUrl}/limitations/${userId}`;
    return this.http.get<string[]>(url);
  }
  setImageToUser(userId: number, imageURL: string) {
    const currentUsers = this.usersSubject.value;
    const index = currentUsers.findIndex((r) => r.id === userId);
    if (index !== -1) {
      const updatedUsers = [...currentUsers];
      updatedUsers[index] = { ...updatedUsers[index], avatarUrl: imageURL };
      this.usersSubject.next(updatedUsers);
    }
  }

  setLoadingToUser(userId: number, state: boolean) {
    const currentUsers = this.usersSubject.value;
    const index = currentUsers.findIndex((r) => r.id === userId);
    if (index !== -1) {
      const updatedUsers = [...currentUsers];
      updatedUsers[index] = { ...updatedUsers[index], loading: state };
      this.usersSubject.next(updatedUsers);
    }
  }

  updateUserInUsers(user: IUser) {
    const currentUsers = this.usersSubject.value;
    const index = currentUsers.findIndex((r) => r.id === user.id);
    if (index !== -1) {
      const updatedUsers = [...currentUsers];
      updatedUsers[index] = user;
      this.usersSubject.next(updatedUsers);
    }
  }

  addUserToUsers(user: IUser) {
    let updatedUsers: IUser[] = [];
    const currentUsers = this.usersSubject.value;
    const index = currentUsers.findIndex((r) => r.id === user.id);
    if (index !== -1) {
      updatedUsers = currentUsers;
    } else {
      updatedUsers = [...currentUsers, user];
    }
    this.usersSubject.next(updatedUsers);
  }
  deleteUserFromUsers(user: IUser) {
    this.usersSubject.next(
      this.usersSubject.value.filter((users) => users.id !== user.id),
    );
  }

  getUsersShortInfoForUpdate() {
    return this.http.get<IUser[]>(`${this.usersUrl}/updates`);
  }

  getInfoForUserpage(userId: number) {
    return this.http.get<IUser>(`${this.usersUrl}/userpage/${userId}`);
  }

  getUserRecipesStatistics(userId: number) {
    return this.http.get<{ likes: number; cooks: number; comments: number }>(
      `${this.usersUrl}/user-recipes-statistics/${userId}`,
    );
  }

  getUserStatistics(userId: number, currentUserId: number) {
    return this.http.get<{
      followers: number;
      followings: number;
      recipes: number;
      follower: number;
    }>(`${this.usersUrl}/user-statistics/${userId}/${currentUserId}`);
  }

  getUser(userId: number) {
    return this.http.get<IUser>(`${this.usersUrl}/${userId}`);
  }

  getProductiveUsers(limit: number, page: number, userId: number) {
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/productive/${userId}?limit=${limit}&page=${page}`,
    );
  }

  getPopularUsers(limit: number, page: number, userId: number) {
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/popular/${userId}?limit=${limit}&page=${page}`,
    );
  }

  getMostViewedUsers(limit: number, page: number, userId: number) {
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/most-viewed/${userId}?limit=${limit}&page=${page}`,
    );
  }
  getNewUsers(limit: number, page: number, userId: number) {
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/new/${userId}?limit=${limit}&page=${page}`,
    );
  }

  getManagers(limit: number, page: number, userId: number) {
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/managers/${userId}?limit=${limit}&page=${page}`,
    );
  }

  getUsersIFollow(limit: number, page: number, userId: number) {
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/my-followers/${userId}?limit=${limit}&page=${page}`,
    );
  }

  getNearbyUsers(limit: number, page: number, userId: number) {
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/nearby/${userId}?limit=${limit}&page=${page}`,
    );
  }
  getFollowersList(userId: number) {
    return this.http.get<IUser[]>(`${this.usersUrl}/following/${userId}`);
  }
  getFollowingList(userId: number) {
    return this.http.get<IUser[]>(`${this.usersUrl}/followers/${userId}`);
  }

  getUserShortInfoForUpdate(userId: number) {
    return this.http.get<IUser>(`${this.usersUrl}/updates/${userId}`);
  }
}
