import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IUser, nullUser } from '../../models/users';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  @Input() loading: number = 0;
  @Input() public users: IUser[] = [];
  @Output() followStateChanges = new EventEmitter();

  ngOnInit() {
    if (this.loading) {
      this.users = Array(this.loading).fill(nullUser);
    }
  }
}
