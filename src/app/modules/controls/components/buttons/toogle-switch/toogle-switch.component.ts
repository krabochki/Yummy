import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  ThemeService,
  themeUI,
} from '../../../../common-pages/services/theme.service';

@Component({
  selector: 'app-toogle-switch',
  templateUrl: './toogle-switch.component.html',
  styleUrls: ['./toogle-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToogleSwitchComponent implements OnInit {
  ngOnInit(): void {
    if (this.nightMode) {
      this.themeService.theme$.subscribe((theme: themeUI) => {
        this.checked = !(theme === 'dark');
        this.cd.markForCheck();
      });
    }
  }
  @Input() checked = false;
  @Input() nightMode = false;
  @Input() backgroundOn = 'var(--color-secondary)';
  @Input() toogleOn = 'var(--color-foreground)';
  @Input() toogleOff = 'var(--color-background)';
  @Input() backgroundOff = 'var(--scroll-thumb)';
  @Output() checkedEmit: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private themeService: ThemeService,
    private cd: ChangeDetectorRef,
  ) {}

  check() {
    this.checked = !this.checked;
    this.checkedEmit.emit(this.checked);
  }
}
