import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IUpdate } from '../components/updates/updates/const';
import { role } from '../../user-pages/models/users';
import { updatesSource } from 'src/tools/sourses';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class UpdatesService {
  updatesSubject = new BehaviorSubject<IUpdate[]>([]);
  updates$ = this.updatesSubject.asObservable();

  private updatesUrl = updatesSource;

  constructor(private http: HttpClient) {}

  deleteUpdate(updateId: number) {
    return this.http.delete(`${this.updatesUrl}/${updateId}`);
  }
  changeUpdateState(updateId: number, state: string) {
    return this.http.put(`${this.updatesUrl}/state/${updateId}`, {
      state: state,
    });
  }

  getTagsBySearch(search: string) {
    const url = `${this.updatesUrl}/tags?search=${search}`;
    return this.http.get<string[]>(url);
  }

  publishUpdate(updateId: number) {
    const url = `${this.updatesUrl}/${updateId}/publish`;
    return this.http.put(url, {});
  }

  isInitialize = false;

  getPublicUpdates(
    limit: number,
    page: number,
    role: role,
    filter?: 'state' | 'tag',
    filterContent?: string,
  ): Observable<IUpdate[]> {
    let url = `${this.updatesUrl}?limit=${limit}&page=${page}&role=${role}`;

    if (filter) {
      url += `&${filter}=${filterContent}`;
    }

    return this.http.get<IUpdate[]>(url);
  }

  getAwaitingUpdatesCount() {
    const url = `${this.updatesUrl}/awaits-count`;

    return this.http.get<number>(url);
  }

  getAwaitsUpdates(limit: number, page: number) {
    const url = `${this.updatesUrl}/public?limit=${limit}&page=${page}`;
    return this.http.get<IUpdate[]>(url);
  }

  setUpdates(updates: IUpdate[]) {
    this.updatesSubject.next(updates);
  }

  postUpdate(update: IUpdate) {
    return this.http.post(this.updatesUrl, update);
  }

  addUpdateToUpdates(update: IUpdate) {
    const currentUpdates = this.updatesSubject.value;
    const updatedUpdates = [...currentUpdates, update];
    this.updatesSubject.next(updatedUpdates);
  }
  deleteUpdateFromUpdates(updateId: number) {
    this.updatesSubject.next(
      this.updatesSubject.value.filter((updates) => updates.id !== updateId),
    );
  }

  updateUpdateInUpdates(update: IUpdate) {
    const currentUpdates = this.updatesSubject.value;
    const index = currentUpdates.findIndex((r) => r.id === update.id);
    if (index !== -1) {
      const updatedUpdates = [...currentUpdates];
      updatedUpdates[index] = update;

      this.updatesSubject.next(updatedUpdates);
    }
  }
}
