import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Добро пожаловать');
  }

  async ngOnInit() {
    const hashParams = window.location.hash
      .substring(1)
      .replace('/welcome#', '');

    const result = this.authService.loginUserWithToken(hashParams);
    if (result !== false) {
      const { error } = await result;
      if (error) {
        this.router.navigateByUrl('/');
      }
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
