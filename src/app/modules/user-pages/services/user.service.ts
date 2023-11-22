import { Injectable } from '@angular/core';
import { IUser, PermissionContext } from '../models/users';
import {
  BehaviorSubject,
} from 'rxjs';
import { usersUrl } from 'src/tools/source';
import { allPunctuationMarks, brackets } from 'src/tools/regex';
import { supabase } from '../../controls/image/supabase-data';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersSubject = new BehaviorSubject<IUser[]>([]);
  users$ = this.usersSubject.asObservable();
  url: string = usersUrl;

  getMaxUserId() {
    return supabase
      .from('profiles')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .then((response) => {
        if (response.data && response.data.length > 0) {
          return response.data[0].id;
        } else {
          return 0;
        }
      });
  }

  loadUsersData() {
    this.loadUsersFromSupabase();
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

  getNearby(users: IUser[], user: IUser): IUser[] {
    if (user.location.trim() !== '') {
      const currentUserLocationWords = user.location
        .toLowerCase()
        .replace(brackets, ' ')
        .split(allPunctuationMarks);

      let matchingUsers = users.filter((item) => {
        if (item.location.trim() !== '') {
          const userLocationWords = item.location
            .toLowerCase()
            .replace(brackets, ' ')
            .split(allPunctuationMarks);
          //есть ли хотя бы одно совпадающее слово
          return currentUserLocationWords.some((word) =>
            userLocationWords.includes(word),
          );
        }
        return null;
      });

      matchingUsers = matchingUsers.filter((item) => item.id !== user.id);

      return matchingUsers;
    } else return [];
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

  deleteDataAboutDeletingUser(deletingId: number) {
    let users: IUser[] = [];
    this.users$.subscribe((data) => {
      users = data;
      users.forEach((user) => {
        if (user.followersIds.includes(deletingId)) {
          user.followersIds = user.followersIds?.filter(
            (element) => element !== deletingId,
          );
          this.updateUser(user);
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

  private async updateUser(user: IUser) {
    await this.updateUserInSupabase(user);
  }

  loadUsersFromSupabase() {
    supabase
      .from('profiles')
      .select('*')
      .then((response) => {
        const supRecipes = response.data;
        const users = supRecipes?.map((supUser) => {
          return this.translateUser(supUser);
        });
        if (users) this.usersSubject.next(users);
      });
  }

  private translateUser(user: any): IUser {
    return {
      id: user.id || 0, // Уникальный идентификатор пользователя
      username: user.username || '', // Имя пользователя
      avatarUrl: user.avatarurl || '', // URL аватара пользователя
      description: user.description || '', // Описание пользователя
      quote: user.quote || '', // Цитата пользователя
      email: user.email,
      fullName: user.fullname || '', // Полное имя пользователя
      followersIds: user.followersids || [], // Список идентификаторов подписчиков
      socialNetworks: user.socialnetworks || [], // Список социальных сетей пользователя
      personalWebsite: user.personalwebsite || '', // Личный веб-сайт пользователя
      location: user.location || '', // Локация пользователя
      profileViews: user.profileviews || 0, // Количество просмотров профиля
      role: user.role || 'user',
      notifications: user.notifications || [],
      permissions: user.permissions || [],
      exclusions: user.exclusions || [],
      permanent: user.permanent || [],
      emojiStatus: user.emojistatus || null,
    } as IUser;
  }
  async addUserToSupabase(id: number, username: string, email: string) {
    return supabase.from('profiles').upsert([
      {
        id: id,
        username: username,
        email: email,
        role: 'user',
      },
    ]);
  }
  deleteUserFromSupabase(id: number) {
    return supabase.from('profiles').delete().eq('id', id);
  }
  updateUserInSupabase(user: IUser) {
    const { id, ...updateData } = user;
    return supabase
      .from('profiles')
      .update({
        username: user.username,
        email: user.email,
        avatarurl: user.avatarUrl || '',
        description: user.description || '', // Описание пользователя
        quote: user.quote || '', // Цитата пользователя
        fullname: user.fullName || '', // Полное имя пользователя
        followersids: user.followersIds || [], // Список идентификаторов подписчиков
        socialnetworks: user.socialNetworks || [], // Список социальных сетей пользователя
        personalwebsite: user.personalWebsite || '', // Личный веб-сайт пользователя
        location: user.location || '', // Локация пользователя
        profileviews: user.profileViews || 0, // Количество просмотров профиля
        role: user.role || 'user',
        notifications: user.notifications || [],
        permissions: user.permissions || [],
        exclusions: user.exclusions || [],
        permanent: user.permanent || [],
        emojistatus: user.emojiStatus || null,
      })
      .eq('id', id);
  }

  updateUsersAfterUPSERT(payload: any) {
    const currentUsers = this.usersSubject.value;
    const index = currentUsers.findIndex(
      (r) => r.id === this.translateUser(payload).id,
    );
    if (index !== -1) {
      const updatedUsers = [...currentUsers];
      updatedUsers[index] = this.translateUser(payload);

      this.usersSubject.next(updatedUsers);
    }
  }

  updateUsersAfterINSERT(payload: any) {
    const currentUsers = this.usersSubject.value;
    const updatedUsers = [...currentUsers, this.translateUser(payload)];
    this.usersSubject.next(updatedUsers);
  }
  updateUsersAfterDELETE(payload: any) {
    this.usersSubject.next(
      this.usersSubject.value.filter(
        (users) => users.id !== this.translateUser(payload).id,
      ),
    );
  }

  getUsersWhichWillBeUpdatedWhenUserDeleting(
    users: IUser[],
    user: IUser,
  ): IUser[] {
    const usersToUpdate: IUser[] = [];
    users.forEach((u) => {
      if (u.followersIds.includes(user.id)) {
        u.followersIds = u.followersIds.filter((f) => f !== user.id);
        usersToUpdate.push(u);
      }
    });
    return usersToUpdate;
  }

  getPermission(context: PermissionContext, user: IUser): boolean {
    const permissions = user.permissions;

    //возвращаем что уведомление включено true, только если оно конкретно не установлено false

    if (permissions && permissions.length) {
      const permissionExist = permissions.find((p) => p.context === context);
      if (permissionExist) return permissionExist.enabled;
      else return true;
    }
    return true;
  }
}
