import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-toogle-switch',
  templateUrl: './toogle-switch.component.html',
  styleUrls: ['./toogle-switch.component.scss'],
})
export class ToogleSwitchComponent implements OnInit {
  ngOnInit(): void {
    if (this.nightMode) {
      if (localStorage.getItem('theme') == 'dark') {
        this.checked = true;
      }
    }
  }
  @Input() nightMode = false;
  @Input() backgroundOn = 'white';
  @Input() toogleOn = 'black';
  @Input() toogleOff = 'white';
  @Input() backgroundOff = 'black';
  @Output() checkedEmit: EventEmitter<boolean> = new EventEmitter();

  checked: boolean = false;
  check() {
    this.checked = !this.checked;
    this.checkedEmit.emit(this.checked);
  }
}
