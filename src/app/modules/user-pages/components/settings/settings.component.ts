import { trigger } from '@angular/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { slide, slideReverse,modal, heightAnim } from 'src/tools/animations';
import { IUser } from '../../models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Router } from '@angular/router';
import localeRu from '@angular/common/locales/ru';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  animations: [
    trigger('slide', slide()),
    trigger('slideReverse', slideReverse()),
    trigger('modal', modal()),
    trigger('heightAnim', heightAnim()),
  ],
})
export class SettingsComponent {
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  currentPage: number = 0;
  exitModalShow: boolean = false;
  deleteModalShow: boolean = false;
  location = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) { 
    console.log(window.location.host)
    this.location = 'https://'+ window.location.host;
  }
  


  @Input() user: IUser = {};

  nightMode = false;

  nightModeEmit(event: boolean) {
    this.nightMode = event;
    if (this.nightMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  handleExitModal(event: boolean) {
    if (event) {
      this.authService.logoutUser();
      this.router.navigateByUrl('/');
      window.scrollTo(0, 0);
    }
    this.exitModalShow = false;
  }

  handleDeleteModal(event: boolean) {
    if (event) {
      if (this.user.id) {
        this.authService.deleteUser(this.user.id).subscribe(); //удаляем человека
        this.authService.logoutUser(); //выходим из аккаунта
        this.router.navigateByUrl('/');
        window.scrollTo(0, 0);
      }
    }
    this.deleteModalShow = false;
  }

  clickBackgroundNotContent(elem: Event) {
    //обработка нажатия на фон настроек, но не на блок с настройками
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  showSocialShare = false;
}


