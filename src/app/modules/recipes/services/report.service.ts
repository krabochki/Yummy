import { Injectable } from '@angular/core';
import {
  IComment,
  ICommentReport,
  nullComment,
} from 'src/app/modules/recipes/models/comments';
import { IRecipe } from '../models/recipes';
import { RecipeService } from './recipe.service';
import { IUser } from '../../user-pages/models/users';
import { UserService } from '../../user-pages/services/user.service';
import { commentsSource, reportsSource } from 'src/tools/sourses';
import { HttpClient } from '@angular/common/http';
import { getCurrentDate } from 'src/tools/common';
import { EMPTY } from 'rxjs';
import { IReport } from '../../authentication/components/control-dashboard/reports/const';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  url: string = reportsSource;

  constructor(private http: HttpClient) {}

  getReportsCount(userId: number) {
    return this.http.get(`${this.url}/count/${userId}`);
  }

  deleteReport(reportId: number) {
    return this.http.delete(`${this.url}/${reportId}`);
  }

  getReports(limit: number, page: number, userId: number) {
    const url = `${this.url}/${userId}?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }
  postReport(commentId: number, reporterId: number) {
    const report: IReport = {
      commentId: commentId,
      reporterId: reporterId,
    };
    return this.http.post(`${this.url}`, report);
  }
}
