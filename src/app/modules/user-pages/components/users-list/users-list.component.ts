import { Component, Input } from '@angular/core';
import { IUser } from '../../models/users';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent {

  @Input() public users:IUser[] = []

}
