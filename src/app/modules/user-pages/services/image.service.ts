import { Injectable } from '@angular/core';
import { IUser } from '../models/users';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject, tap
} from 'rxjs';
import { usersUrl } from 'src/tools/source';
import { IImage } from '../models/images';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private imagesSubject = new BehaviorSubject<IImage[]>([]);
  images$ = this.imagesSubject.asObservable();
  url: string = usersUrl;

  constructor(private http: HttpClient) {}

  loadImagesData() {
    this.getImages().subscribe((data) => {
      this.imagesSubject.next(data);
    });
  }

  getImages() {
    return this.http.get<IImage[]>(this.url);
  }

  postImage(image: IImage) {
    return this.http.post<IImage>(this.url, image).pipe(
      tap((newImage: IImage) => {
        const currentImages = this.imagesSubject.value;
        const updatedImages = [...currentImages, newImage];
        this.imagesSubject.next(updatedImages);
      }),
    );
  }
}
