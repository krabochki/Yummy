import {
  Component, OnInit
} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {


  ngOnInit() {
  
    if (localStorage.getItem('theme') =='dark') {
          document.body.classList.add('dark-mode');
        } else {
          localStorage.setItem('theme', 'light');
        }

}
  title = 'yummy';

  height = 0;

  mergeHeight(height: number) {
    this.height = height;
  }
  mergeFooterHeight(height: number) {
    this.height = height;
  }
}
