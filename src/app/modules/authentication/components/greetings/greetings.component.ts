import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
@Component({
  selector: 'app-greetings',
  templateUrl: './greetings.component.html',
  styleUrls: ['../../common-styles.scss'],
})
export class GreetingsComponent {

  constructor(private titleService: Title) {
    
  
    this.titleService.setTitle('Войдите или зарегистрируйтесь');
  }
}
