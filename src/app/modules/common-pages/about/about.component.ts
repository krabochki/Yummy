import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../authentication/services/auth.service';
import { IUser } from '../../user-pages/models/users';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['../styles/common.scss']
})
export class AboutComponent implements OnInit{

  auth = false;

  constructor(private titleService: Title,private authService:AuthService) {
    this.titleService.setTitle('О сайте');
  }

  ngOnInit(): void{
    this.authService.currentUser$.subscribe(
      (receivedUser: IUser) =>
       { if (receivedUser.id) { this.auth = true }} 
    )
  }
}
