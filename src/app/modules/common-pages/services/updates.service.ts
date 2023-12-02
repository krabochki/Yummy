import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IUpdate } from '../updates/updates/const';
import { supabase } from '../../controls/image/supabase-data';
import { INotification } from '../../user-pages/models/notifications';
import { IUser } from '../../user-pages/models/users';

@Injectable({
  providedIn: 'root',
})
export class UpdatesService {
  updatesSubject = new BehaviorSubject<IUpdate[]>([]);
  updates$ = this.updatesSubject.asObservable();

  loadUpdatesData() {
    return this.loadUpdatesFromSupabase();
  }

  getMaxUpdateId() {
    return supabase
      .from('updates')
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

  loadUpdatesFromSupabase() {
    return supabase
      .from('updates')
      .select('*')
      .then((response) => {
        const updates = response.data;
        if (updates) this.updatesSubject.next(updates);
      });
  }

  addUpdateToSupabase(update: IUpdate) {
    return supabase.from('updates').upsert([
      {
        id: update.id,
        shortName: update.shortName,
        fullName: update.fullName,
        link: update.link,
        showAuthor: update.showAuthor,

        description: update.description,
        date: update.date,
        tags: update.tags,
        state: update.state,
        whoCanView: update.whoCanView,

        context: update.context,
        author: update.author,

        status: update.status,
      },
    ]);
  }

  async addNotificationToUsers(
    newNotification: INotification,
    users: IUser[],
    context: string,
  ) {
    let usersToUpdate = [];
    switch (context) {
      case 'Уведомить всех кулинаров':
        usersToUpdate = users;
        break;
      case 'Уведомить модераторов и администратора':
        usersToUpdate = users.filter((u) => u.role !== 'user');
        break;
      case 'Никого не уведомлять':
        return;
      default:
        return;
    }

    const updatedUsers = usersToUpdate.map((user: IUser) => {
      const notifications = user.notifications || [];
      const maxId = Math.max(...user.notifications.map((n) => n.id));
      const editedNotification = { ...newNotification, id: maxId + 1 };
      notifications.push(editedNotification);
      return { ...user, notifications };
    });

    const updates = updatedUsers.map((user) => ({
      username: user.username,
      email: user.email,
      id: user.id,
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
    }));

    return supabase.from('profiles').upsert(updates);
  }

  deleteUpdateFromSupabase(id: number) {
    return supabase.from('updates').delete().eq('id', id);
  }
  async updateUpdateInSupabase(update: IUpdate) {
    const { id } = update;
    await supabase
      .from('updates')
      .update({
        id: update.id,
        shortName: update.shortName,
        fullName: update.fullName,
        link: update.link,
        showAuthor: update.showAuthor,
        description: update.description,
        date: update.date,
        tags: update.tags,
        context: update.context,
        state: update.state,
        author: update.author,
        whoCanView: update.whoCanView,
        status: update.status,
      })
      .eq('id', id);
  }

  updateUpdatesAfterUPSERT(payload: any) {
    const currentUpdates = this.updatesSubject.value;
    const index = currentUpdates.findIndex((r) => r.id === payload.id);
    if (index !== -1) {
      const updatedUpdates = [...currentUpdates];
      updatedUpdates[index] = payload;
      this.updatesSubject.next(updatedUpdates);
    }
  }

  updateUpdatesAfterINSERT(payload: any) {
    const currentUpdates = this.updatesSubject.value;
    const updatedUpdates = [...currentUpdates, payload];
    this.updatesSubject.next(updatedUpdates);
  }
  updateUpdatesAfterDELETE(payload: any) {
    this.updatesSubject.next(
      this.updatesSubject.value.filter(
        (categories) => categories.id !== payload.id,
      ),
    );
  }
}
