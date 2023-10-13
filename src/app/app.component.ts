import {
  Component
} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {



  title = 'yummy';

  height = 0;

  mergeHeight(height: number) {
    this.height = height;
  }
  mergeFooterHeight(height: number) {
    this.height = height;
  }
}
