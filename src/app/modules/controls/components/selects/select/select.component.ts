import { trigger } from '@angular/animations';
import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { modal, heightAnim } from 'src/tools/animations';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { baseComparator } from 'src/tools/common';
@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  animations: [trigger('modal', modal()), trigger('select', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent implements AfterViewInit {
  @Output() clickedEmit: EventEmitter<boolean> = new EventEmitter();

  @Output() optionClick: EventEmitter<string> = new EventEmitter();

  @Input() items: string[] = [];

  @Input() routes: { routeLink: string; disabled: boolean }[] = [];

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
      this.open = false;
    }
    this.noAccessModalShow = false;
  }
}



