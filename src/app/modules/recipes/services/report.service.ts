import { Injectable } from '@angular/core';
import {  reportsSource } from 'src/tools/sourses';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  url: string = reportsSource;

  constructor(private http: HttpClient) {}

  getReportsCount() {
    const options = { withCredentials: true };
    return this.http.get(`${this.url}/count`, options);
  }

  deleteReport(reportId: number) {
    const options = { withCredentials: true };
    return this.http.delete(`${this.url}/${reportId}`, options);
  }

  getReports(limit: number, page: number) {
        const options = { withCredentials: true };

    const url = `${this.url}?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }
  postReport(commentId: number) {
          const options = { withCredentials: true };

    return this.http.post(`${this.url}`, { commentId: commentId }, options);
  }
}
