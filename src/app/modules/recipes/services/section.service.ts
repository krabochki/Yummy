import { Injectable } from '@angular/core';
import { ICategory, ISection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  urlSections: string = 'http://localhost:3000/sections';

  sectionsSubject = new BehaviorSubject<ISection[]>([]);
  sections$ = this.sectionsSubject.asObservable();

  constructor(private http: HttpClient) {
  
  }
  loadSectionData() {
     this.getSections().subscribe((data) => {
       this.sectionsSubject.next(data);
     });
  }

  getSections() {
    return this.http.get<ISection[]>(this.urlSections);
  }

  getSection(id: number) {
    return this.http.get<ISection>(`${this.urlSections}/${id}`);
  }

  deleteSection(id: number) {
    return this.http.delete<ISection>(`${this.urlSections}/${id}`);
  }

  postSection(category: ISection) {
    return this.http.post<ISection>(this.urlSections, category);
  }
}
