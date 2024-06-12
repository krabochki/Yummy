import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUpdate } from '../components/updates/updates/const';
import { updatesSource } from 'src/tools/sourses';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class UpdatesService {
  private updatesUrl = updatesSource;

  constructor(private http: HttpClient) {}

  getStatus(updateId: number) {
    const options = { withCredentials: true };

    const url = `${this.updatesUrl}/isAwaits/${updateId}`;
    return this.http.get(url, options);
  }

  deleteUpdate(updateId: number) {
    const options = { withCredentials: true };
    return this.http.delete(`${this.updatesUrl}/${updateId}`, options);
  }
  changeUpdateState(updateId: number, state: string) {
    const options = { withCredentials: true };

    return this.http.put(
      `${this.updatesUrl}/state/${updateId}`,
      {
        state: state,
      },
      options,
    );
  }

  getTagsBySearch(search: string) {
    const options = { withCredentials: true };

    const url = `${this.updatesUrl}/tags?search=${search}`;
    return this.http.get<string[]>(url, options);
  }

  publishUpdate(updateId: number) {
    const options = { withCredentials: true };

    const url = `${this.updatesUrl}/${updateId}/publish`;
    return this.http.put(url, {}, options);
  }

  getPublicUpdates(
    limit: number,
    page: number,
    filter?: 'state' | 'tag',
    filterContent?: string,
  ): Observable<IUpdate[]> {
    let url = `${this.updatesUrl}?limit=${limit}&page=${page}`;
    const options = { withCredentials: true };

    if (filter) {
      url += `&${filter}=${filterContent}`;
    }

    return this.http.get<IUpdate[]>(url, options);
  }

  getAwaitingUpdatesCount() {
    const options = { withCredentials: true };

    const url = `${this.updatesUrl}/awaits-count`;

    return this.http.get<number>(url, options);
  }

  getAwaitsUpdates(limit: number, page: number) {
    const options = { withCredentials: true };
    const url = `${this.updatesUrl}/awaits?limit=${limit}&page=${page}`;
    return this.http.get<IUpdate[]>(url, options);
  }

  postUpdate(update: IUpdate) {
    const options = { withCredentials: true };

    return this.http.post(this.updatesUrl, update, options);
  }
}
