import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { IGroup } from '../../../models/ingredients';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { EMPTY, Subject, catchError, finalize, takeUntil, tap } from 'rxjs';
import { GroupService } from '../../../services/group.service';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';

@Component({
  templateUrl: './groups-page.component.html',
  styleUrl: './groups-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal())],
})
export class GroupsPageComponent implements OnInit {
  loaded = true;
  everythingLoaded = false;
  groups: IGroup[] = [];
  currentUserId = 0;
  currentUser: IUser = nullUser;
  step = 0;
  groupsPerStep = 10;

  initialLoading = true;

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private groupService: GroupService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 740) {
      this.groupsPerStep = 4;
    } else if (screenWidth <= 960) {
      this.groupsPerStep = 6;
    } else if (screenWidth <= 1400) {
      this.groupsPerStep = 8;
    }
    this.cd.markForCheck();
    this.getCurrentUserData();
    this.titleService.setTitle('Группы ингредиентов');
  }

  getCurrentUserData() {
    this.authService.getTokenUser().subscribe((receivedUser) => {
      this.currentUserId = receivedUser.id;
                    this.initialLoading = false;

      this.getGroupsData();
    });
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        this.currentUser = receivedUser;
      });
  }

  getGroupsData() {
    this.groups = [];
    this.everythingLoaded = false;
    this.step = 0;
    this.loadMoreGroups();
  }

  updateAfterChanges() {
    this.getGroupsData();
  }

  loadMoreGroups() {
    if (this.loaded) {
      this.loaded = false;
        this.cd.markForCheck();
        this.groupService
          .getSomeFullGroups(this.groupsPerStep, this.step)
          .subscribe((res: any) => {
            const newGroups: IGroup[] = res.results;
            const count = res.count;

            const actualGroups = newGroups.filter(
              (newGroup) =>
                !this.groups.some(
                  (existingGroup) => existingGroup.id === newGroup.id,
                ),
            );

            if (actualGroups.length > 0) {
              this.groups = [...this.groups, ...actualGroups];
              this.step++;
            } else {
              this.everythingLoaded = true;
            }

            actualGroups.forEach((group) => {
              this.loadGroupImage(group);
            });

            if (count <= this.groups.length) {
              this.everythingLoaded = true;
            }

            this.loaded = true;

            this.cd.markForCheck();
          });
    }
  }

  loadGroupImage(group: IGroup) {
    if (group.image) {
      group.imageLoading = true;

      this.groupService
        .downloadImage(group.image)
        .pipe(
          finalize(() => {
            group.imageLoading = false;
            this.cd.markForCheck();
          }),
          tap((blob) => {
            if (blob) {
              group.imageURL = URL.createObjectURL(blob);
            }
          }),
          catchError(() => {
            return EMPTY;
          }),
        )
        .subscribe();
    }
  }

  createModal = false;
  accessModal = false;

  createButtonClick() {
    if (!(this.groups.length === 0 && !this.loaded)) {
      if (this.currentUser.id > 0) {
        this.createModal = true;
      }
    }
  }
}
