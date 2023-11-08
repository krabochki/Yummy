import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IUser } from '../../models/users';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent {
  @Input() adminpanel = false;
  @Input() public users: IUser[] = [];
  @Output() demoteClick = new EventEmitter<IUser>();

  demote(event:IUser) {
    this.demoteClick.emit(event)
  }
}
