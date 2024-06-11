import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { achievementsSource } from 'src/tools/sourses';
import { IAchievement } from '../models/achievement';

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  achievementUrl = achievementsSource;

  constructor(private http: HttpClient) {}

  postAchievement(achievement: IAchievement) {
    const options = { withCredentials: true };
    const url = `${this.achievementUrl}`;
    return this.http.post(url, achievement, options);
  }

  getAchievementsCount() {
    const options = { withCredentials: true };
    const url = `${this.achievementUrl}/count`;
    return this.http.get<number>(url, options);
  }

  getAchievements(limit: number, page: number) {
    const options = { withCredentials: true };

    const url = `${this.achievementUrl}?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }

  achieve(achievementId: number) {
    const options = { withCredentials: true };
    const url = `${this.achievementUrl}/achieve/${achievementId}`;
    return this.http.post(url, {}, options);
  }

  getUserAchievements() {
    const options = { withCredentials: true };
    const url = `${this.achievementUrl}/public`;
    return this.http.get<IAchievement[]>(url, options);
  }

  getFirstUserAchievements(userId: number) {
    const url = `${this.achievementUrl}/first/${userId}`;
    return this.http.get<IAchievement[]>(url);
  }

  getSomeUserAchievements(offset: number, limit: number) {
    const options = { withCredentials: true };

    const url = `${this.achievementUrl}/some?offset=${offset}&limit=${limit}`;

    return this.http.get<any>(url, options);
  }



  getAchievementByKind(kind: string,score: number) {
    const options = { withCredentials: true };
    const url = `${this.achievementUrl}/${kind}?score=${score}`;
    return this.http.get(url, options);
  }



  deleteAchievement(achievementId: number) {
    const options = { withCredentials: true };
    const url = `${this.achievementUrl}/${achievementId}`;
    return this.http.delete(url, options);
  }

  deleteIcon(achievementId: number) {
    const options = { withCredentials: true };
    const url = `${this.achievementUrl}/files/${achievementId}`;
    return this.http.delete(url, options);
  }

  uploadIcon(file: File) {
    const options = { withCredentials: true };

    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(`${this.achievementUrl}/image`, formData, options);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.achievementUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  setIconToAchievement(achievementId: number, iconUrl: string) {
    const options = { withCredentials: true };

    const url = `${this.achievementUrl}/set-icon/${achievementId}`;
    return this.http.put(url, { url: iconUrl }, options);
  }
}
