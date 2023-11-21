import { Component } from '@angular/core';
import { ImageService } from '../../controls/image/image.service';
import { createClient } from '@supabase/supabase-js';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { supabaseUrl, supabaseKey } from '../../controls/image/supabase-data';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent {
  supabase = createClient(supabaseUrl, supabaseKey);

  _avatarUrl:SafeResourceUrl = ''

  constructor(private readonly dom: DomSanitizer) {}

  async downloadImage(path: string) {
    try {
      const { data } = await this.supabase.storage
        .from('userpics')
        .download(path);
      if (data instanceof Blob) {
        this._avatarUrl = this.dom.bypassSecurityTrustResourceUrl(
          URL.createObjectURL(data),
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error downloading image: ', error.message);
      }
    }
  }

  uploading = false;
  async uploadAvatar(event: any) {
    try {
      this.uploading = true;
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;
      await this.supabase.storage.from('userpics').upload(filePath, file);
      this.downloadImage(filePath);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.uploading = false;
    }
  }

  getPublicSrc(src: string) {
    return this.supabase.storage.from('userpics').getPublicUrl(src).data
      .publicUrl;
  }
}
