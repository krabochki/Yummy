import { trigger, transition, style, animate } from '@angular/animations';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../authentication/services/auth.service';
import { modal } from 'src/tools/animations';
import { Router } from '@angular/router';


@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  animations: [
    trigger('modal', modal()),
    trigger('select', [
      transition(':enter', [
        style({ height: '0' }),
        animate('300ms ease-out', style({ height: '*' })),
      ]),
      transition(':leave', [
        style({ height: '*' }),
        animate('300ms ease-in', style({ height: '0' })),
      ]),
    ]),
  ],
})
export class SelectComponent implements AfterViewInit {
  @Output() clickedEmit: EventEmitter<boolean> = new EventEmitter();

  @Input() items: string[] = [];
  @Input() disabling: boolean[] = [];
  @Input() routerLinks: string[] = [];

  noAccessModalShow = false;

  constructor(private router: Router) {}

  open: boolean = false;

  shiftedItems?: string[];

  bodyHeight: number | undefined = 0;
  ngAfterViewInit() {
    this.shiftedItems = [...this.items];
    this.shiftedItems.shift();
  }

  linkClick(disable: boolean) {
    if (disable) {
      this.noAccessModalShow = true;
    }

  }
  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
        window.scrollTo(0, 0);
      this.open = false;
    }
    this.noAccessModalShow = false;
  }
}



