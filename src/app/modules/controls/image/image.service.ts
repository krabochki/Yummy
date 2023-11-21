import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { createClient } from '@supabase/supabase-js';
import { supabaseKey, supabaseUrl } from './supabase-data';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class ImageService {

  constructor(private readonly dom:DomSanitizer) {
    
  }
  
}
