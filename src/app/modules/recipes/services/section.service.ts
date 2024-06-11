import { Injectable } from '@angular/core';
import {  ISection } from '../models/categories';
import {  Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { sectionsSource } from 'src/tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  sectionsUrl = sectionsSource;

  constructor(private http: HttpClient) {}

  updateSection(updatedSection: ISection) {
  const options = { withCredentials: true };
    return this.http.put(
      `${this.sectionsUrl}/${updatedSection.id}`,
      updatedSection, options
    );
  }

  getSection(sectionId: number): Observable<ISection> {
    const options = { withCredentials: true };
    const url = `${this.sectionsUrl}/some/${sectionId}`;
    return this.http.get<ISection>(url, options);
  }

  getSectionForEditing(id: number): Observable<ISection> {
    const options = { withCredentials: true };
    const url = `${this.sectionsUrl}/edit/${id}`;
    return this.http.get<ISection>(url, options);
  }

  getCategoriesAndSectionsBySearch(searchText: string) {
    const url = `${this.sectionsUrl}/global/search/?search=${searchText}`;
    return this.http.get(url);
  }

  getSectionsBySearch(searchText: string) {
    const url = `${this.sectionsUrl}/search/?search=${searchText}`;
    return this.http.get<ISection[]>(url);
  }

  getSomeSections(limit: number, page: number) {
    const url = `${this.sectionsUrl}/some?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  

  getDeletedCategoriesImages(sectionId: number): Observable<number[]> {
        const options = { withCredentials: true };

    const url = `${this.sectionsUrl}/deleted-categories-with-images/${sectionId}`;
    return this.http.get<number[]>(url, options);
  }

  getAllAboutSomeNotEmptySections(limit: number, page: number) {
            const options = { withCredentials: true };

    const url = `${this.sectionsUrl}/all-not-empty?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }
  setImageToSection(sectionId: number, filename: string) {
            const options = { withCredentials: true };

    return this.http.put(`${this.sectionsUrl}/connect-image/${sectionId}`, {
      image: filename,
    }, options);
  }

  uploadSectionImage(file: File) {
    const options = { withCredentials: true };
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(`${this.sectionsUrl}/image`, formData, options);
  }


  deleteSection(sectionId: number) {
    const options = { withCredentials: true };

  return this.http.delete(`${this.sectionsUrl}/${sectionId}`,options);
  }

  deleteImage(sectionId:number) {
    const options = { withCredentials: true };
    const url = `${this.sectionsUrl}/files/${sectionId}`;
    return this.http.delete(url, options);
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.sectionsUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }






  postSection(newSection: ISection) {
    const options = { withCredentials: true };
    const url = `${this.sectionsUrl}/section`;
    return this.http.post(url, newSection, options);
  }

  


  getSomeFullSections(limit: number, page: number) {
        const options = { withCredentials: true };

    const url = `${this.sectionsUrl}/some-full?limit=${limit}&page=${page}`;
    return this.http.get(url,options);
  }



 
  
}
