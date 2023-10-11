import { animate, style, transition, trigger } from '@angular/animations';
import { Component, DoCheck, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('settingsMobile', [
      transition(':enter', [
        style({ opacity: '0' }),
        animate('300ms ease-out', style({ opacity: '1' })),
      ]),
      transition(':leave', [
        style({ opacity: '1' }),
        animate('300ms ease-in', style({ opacity: '0' })),
      ]),
    ]),
  ],
})
export class HeaderComponent implements OnInit, DoCheck {
  recipeSelectItems: string[] = [
    'Рецепты',
    'Ваши рецепты',
    'Все рецепты',
    'Все категории',
    'Закладки',
    'Подбор рецептов',
  ];
  cooksSelectItems: string[] = [
    'Кулинары',
    'Ваш профиль',
    'Все кулинары',
    'Обновления',
  ];

  mobile: boolean = false;
  hambOpen: boolean = false;

  @Output() emitter: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    if (screen.width <= 480) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }
  }
  ngDoCheck() {
    const element = document.querySelector('.header') as HTMLElement | null;
    const height = element?.offsetHeight;

    this.emitter.emit(height);
  }

  closeSettings() {
    this.hambOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth <= 480) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }

    const element = document.querySelector('.header') as HTMLElement | null;

    const height = element?.offsetHeight;

    this.emitter.emit(height);
  }

  constructor(public authService: AuthService) {}
}
