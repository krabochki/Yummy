import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../../authentication/services/auth.service';
import { IUser, nullUser } from '../../../user-pages/models/users';
import { UpdatesService } from '../../services/updates.service';
import { IUpdate } from './const';
import { UserService } from '../../../user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { baseComparator } from 'src/tools/common';

@Component({
  selector: 'app-updates',
  templateUrl: './updates.component.html',
  styleUrls: ['../../styles/common.scss', './updates.component.scss'],

  animations: [trigger('modal', modal())],
})
export class UpdatesComponent implements OnInit {
  updates: IUpdate[] = [];
  showedUpdates: IUpdate[] = [];
  START_UPDATES_TO_SHOW = 2;
  UPDATES_TO_LOAD_MORE = 2;
  filtered: 'state' | 'tag' | 'no' = 'no';
  filterContext = '';
  currentUser: IUser = nullUser;
  users: IUser[] = [];
  addUpdateMode = false;

  constructor(
    titleService: Title,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private updateService: UpdatesService,
  ) {
    titleService.setTitle('Обновления');
  }

  ngOnInit() {
    this.userService.users$.subscribe((receivedUsers: IUser[]) => {
      this.users = receivedUsers;
    });
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.currentUser = receivedUser;
    });
    this.updateService.updates$.subscribe((receivedUpdates: IUpdate[]) => {
      this.updates = receivedUpdates.filter((u) => u.status === 'public');
      if (this.currentUser.role === 'user') {
        this.updates = this.updates.filter((u) => u.whoCanView === 'all');
      }
      this.updates = this.updates.sort((a,b)=>baseComparator(new Date(b.date),new Date(a.date)))
      this.showedUpdates = this.updates.slice(0, this.START_UPDATES_TO_SHOW);
    });
  }

  loadMoreUpdates() {
    const current = this.showedUpdates;
    const currentLength = this.showedUpdates.length;
    const next = this.updates.slice(
      currentLength,
      currentLength + this.UPDATES_TO_LOAD_MORE,
    );
    this.showedUpdates = [...current, ...next];
  }

  filterByTag(tag: string) {
    this.filtered = 'tag';
    this.filterContext = tag;
    this.showedUpdates = this.updates.filter((u) => u.tags.includes(tag));
  }
  filterByState(state: string) {
    this.filtered = 'state';
    this.filterContext = state;
    this.showedUpdates = this.updates.filter((u) => u.state === state);
  }

  clearFilter() {
    this.filtered = 'no';
    this.filterContext = '';
    this.showedUpdates = this.updates.slice(0, this.START_UPDATES_TO_SHOW);
  }

  showDeleteButton() {
    return this.userService.getPermission(
      'show-delete-update',
      this.currentUser,
    );
  }

  showAuthor(update: IUpdate): boolean {
    if (update.author > 0) {
      if (update.showAuthor === true || update.showAuthor === null)
        if (this.findUser(update.author).id !== 0) {
          if (
            this.userService.getPermission(
              'show-status',
              this.findUser(update.author),
            )
          ) {
            return true;
          }
        }
    }
    return false;
  }
  awaitModalShow = false;
  targetUpdateId: number = 0;
  deleteModalShow = false;
  handleDeleteModal(answer: boolean) {
    this.deleteModalShow = false;

    if (answer) {
      this.deleteUpdate(this.targetUpdateId);
    }
  }

  async deleteUpdate(id: number) {
    this.awaitModalShow = true;
    await this.updateService.deleteUpdateFromSupabase(id);
    this.awaitModalShow = false;
    this.cd.markForCheck();
    this.targetUpdateId = 0;
  }

  updateAuthorRole(id: number): string {
    const user: IUser = this.findUser(id);
    if (user.id > 0) {
      if (user.role === 'admin') return 'администратор';
      if (user.role === 'moderator') return 'модератор';
    }
    return '';
  }

  updateAuthor(id: number): string {
    const user: IUser = this.findUser(id);
    if (user.id > 0) {
      if (this.userService.getPermission('show-status', user)) {
        const name = user.fullName ? user.fullName : '@' + user.username;
        return name;
      }
    }
    return '';
  }

  findUser(id: number): IUser {
    return this.users.find((u) => u.id === id) || nullUser;
  }
}
