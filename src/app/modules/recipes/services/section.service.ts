import { Injectable } from '@angular/core';
import { ICategory, ISection, nullSection } from '../models/categories';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { sectionsUrl } from 'src/tools/source';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  urlSections: string = sectionsUrl

  sectionsSubject = new BehaviorSubject<ISection[]>([]);
  sections$ = this.sectionsSubject.asObservable();

  constructor(private http: HttpClient) {}

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

  getNotEmptySections(sections: ISection[]): ISection[] {
    return (sections = sections.filter(
      (section) => section.categoriesId.length > 0,
    ));
  }

  getSectionOfCategory(sections:ISection[], category: ICategory): ISection {
      return (
        sections.find((section) =>
          section.categoriesId.includes(category.id),
        ) || nullSection
      );
  }
}
