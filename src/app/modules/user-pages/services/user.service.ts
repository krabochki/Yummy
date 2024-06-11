/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { IUser } from '../models/users';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { usersSource } from '../../../../tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  isUserSubscriber(user: IUser, userId: number) {
    if (!user) return false;
    return user?.followersIds?.includes(userId);
  }

  public followUser(following: number) {
    const options = { withCredentials: true };
    const url = `${this.usersUrl}/subscribe/${following}`;
    return this.http.post(url,{}, options);
  }

  public unfollowUser(following: number) {
    const options = { withCredentials: true };
    const url = `${this.usersUrl}/subscribe/${following}`;
    return this.http.delete(url,options);
  }

  incrementProfileViews(userId: number) {
    const url = `${this.usersUrl}/profile-views`;
    return this.http.put(url, { userId });
  }

  getManagersShort() {
    const options = { withCredentials: true };

    const url = `${this.usersUrl}/managers-short`;
    return this.http.get(url, options);
  }

  getSomeFollowings(
    userId: number,
    offset: number,
    limit: number,
    search?: string,
  ) {
    const options = { withCredentials: true };

    const url =
      `${this.usersUrl}/followings/${userId}?offset=${offset}&limit=${limit}` +
      (search ? `&search=${search}` : '');
    return this.http.get(url, options);
  }

  getSomeFollowers(
    userId: number,
    offset: number,
    limit: number,
    search?: string,
  ) {
    const options = { withCredentials: true };

    const url =
      `${this.usersUrl}/followers/${userId}?offset=${offset}&limit=${limit}` +
      (search ? `&search=${search}` : '');
    return this.http.get(url, options);
  }

    getSomeUsers(
    offset: number,
    limit: number,
  ) {
    const options = { withCredentials: true };

      const url =
        `${this.usersUrl}/some?page=${offset}&limit=${limit}`;
    return this.http.get(url, options);
  }


  getAllShort() {
    const options = { withCredentials: true };
    const url = `${this.usersUrl}/all-short`;
    return this.http.get(url, options);
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

  getFollowingsBySearch(search: string) {const options = { withCredentials: true };
    const url = `${this.usersUrl}/search/followings?search=${search}`;
    return this.http.get(url,options);
  }

  getNearbyBySearch(search: string) {
    const options = { withCredentials: true };
    const url = `${this.usersUrl}/search/nearby?search=${search}`;
    return this.http.get(url,options);
  }

  getMostProductiveBySearch(search: string) {const options = { withCredentials: true };
    const url = `${this.usersUrl}/search/productive?search=${search}`;
    return this.http.get(url,options);
  }
  getPopularBySearch(search: string) {
    const url = `${this.usersUrl}/search/popular?search=${search}`;
    return this.http.get(url);
  }

  public getUserForEdit(): Observable<IUser> {const options = { withCredentials: true };
    const url = `${this.usersUrl}/edit`;
    return this.http.get<IUser>(url,options);
  }

  updateUserpic(filename: string) {
    const options = { withCredentials: true };

    const url = `${this.usersUrl}/userpic`;
    return this.http.put(url, { image: filename }, options);
  }

  public postLimitation(context: string) {
    const options = { withCredentials: true };
    const url = `${this.usersUrl}/limitations`;
    return this.http.post(url, { limitation: context }, options);
  }
  public deleteLimitation( context: string) {
    const options = { withCredentials: true };

    const url = `${this.usersUrl}/limitations?limitation=${context}`;
    return this.http.delete(url, options);
  }

  usersUrl = usersSource;

  updateUserProperty(
    property:
      | 'username'
      | 'description'
      | 'quote'
      | 'fullName'
      | 'socialNetworks'
      | 'personalWebsite'
      | 'location'
      | 'permissions'
      | 'emoji'
      | 'birthday',
    value: any,
  ): Observable<any> {
        const options = { withCredentials: true };

    const url = `${this.usersUrl}/property/${property}`;
    return this.http.put(url, { value }, options);
  }

  makeModerator(userId: number) {
    const options = { withCredentials: true };
    const url = `${this.usersUrl}/moderator/${userId}`;
    return this.http.post(url, {}, options);
  }
  demoteModerator(userId: number) {
    const options = { withCredentials: true };
    const url = `${this.usersUrl}/moderator/${userId}`;
    return this.http.delete(url, options);
  }

  updatePublicUser(user: IUser) {const options = { withCredentials: true };
    const url = `${this.usersUrl}/public`;
    return this.http.put<IUser>(url, user,options);
  }

  downloadUserpic(filename: string) {
    
    const fileUrl = `${this.usersUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  deleteUserpic(): Observable<any> {
    const options = { withCredentials: true };

    const url = `${this.usersUrl}/files`;
    return this.http.delete(url, options);
  }

  uploadUserpic(file: File): Observable<any> {
    const options = { withCredentials: true };

    const formData: FormData = new FormData();
    formData.append('avatar', file, file.name);

    return this.http.post<any>(`${this.usersUrl}/userpic`, formData, options);
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
  public getLimitations(): Observable<string[]> {    const options = { withCredentials: true };

    const url = `${this.usersUrl}/limitations`;
    return this.http.get<string[]>(url,options);
  }

  getInfoForUserpage(userId:number) {

    return this.http.get<IUser>(`${this.usersUrl}/userpage/${userId}`);
  }

  getUserRecipesStatistics(userId: number) {
    return this.http.get<{ likes: number; cooks: number; comments: number }>(
      `${this.usersUrl}/user-recipes-statistics/${userId}`,
    );
  }

  getUserStatistics(userId: number) {
    const options = { withCredentials: true };
    return this.http.get<{
      followers: number;
      followings: number;
      recipes: number;
      follower: number;
      achievements: number;
    }>(`${this.usersUrl}/user-statistics/${userId}`, options);
  }

  getUser(userId: number) {
    return this.http.get<IUser>(`${this.usersUrl}/user/${userId}`);
  }

  getProductiveUsers(limit: number, page: number) {
       const options = { withCredentials: true };
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/productive?limit=${limit}&page=${page}`, options
    );
  }

  getPopularUsers(limit: number, page: number) {const options = { withCredentials: true };
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/popular?limit=${limit}&page=${page}`,options
    );
  }

  getMostViewedUsers(limit: number, page: number) {
    const options = { withCredentials: true };
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/most-viewed?limit=${limit}&page=${page}`, options
    );
  }
  getNewUsers(limit: number, page: number) {
    const options = { withCredentials: true };
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/new?limit=${limit}&page=${page}`, options
    );
  }

  getManagers(limit: number, page: number) {    const options = { withCredentials: true };

    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/managers?limit=${limit}&page=${page}`, options
    );
  }

  getUsersIFollow(limit: number, page: number, ) {const options = { withCredentials: true };
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/my-followers?limit=${limit}&page=${page}`, options
    );
  }

  getNearbyUsers(limit: number, page: number) {
    const options = { withCredentials: true };
    return this.http.get<{ count: number; users: IUser[] }>(
      `${this.usersUrl}/nearby?limit=${limit}&page=${page}`, options
    );
  }
}
