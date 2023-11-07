import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-toogle-switch',
  templateUrl: './toogle-switch.component.html',
  styleUrls: ['./toogle-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToogleSwitchComponent implements OnInit {
  ngOnInit(): void {
    if (this.nightMode) {
      if (localStorage.getItem('theme') === 'dark') {
        this.checked = false;
      } else this.checked = true;
    }
  }
  @Input() checked = false;
  @Input() nightMode = false;
  @Input() backgroundOn = 'var(--color-secondary)';
  @Input() toogleOn = 'var(--color-foreground)';
  @Input() toogleOff = 'var(--color-background)';
  @Input() backgroundOff = 'var(--scroll-thumb)';
  @Output() checkedEmit: EventEmitter<boolean> = new EventEmitter();

  check() {
    this.checked = !this.checked;
    this.checkedEmit.emit(this.checked);
  }
}
