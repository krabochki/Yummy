import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-greetings',
  templateUrl: './greetings.component.html',
  styleUrls: ['../../common-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreetingsComponent {
  constructor(
    private titleService: Title,
  ) {
    
    this.titleService.setTitle('Войдите или зарегистрируйтесь');
  }
}
