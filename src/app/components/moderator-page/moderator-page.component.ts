import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-moderator-page',
  templateUrl: './moderator-page.component.html',
  styleUrls: ['./moderator-page.component.scss']
})
export class ModeratorPageComponent {


  constructor(public authService:AuthService){
    
  }
}
