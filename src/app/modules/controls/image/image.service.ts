import { Injectable } from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class ImageService {

  constructor(private readonly dom:DomSanitizer) {
    
  }
  
}
