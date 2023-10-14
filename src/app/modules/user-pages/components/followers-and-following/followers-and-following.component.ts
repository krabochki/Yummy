import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { IUser, nullUser } from '../../models/users';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';

@Component({
  selector: 'app-followers-and-following',
  templateUrl: './followers-and-following.component.html',
  styleUrls: ['./followers-and-following.component.scss'],
  animations: [
    trigger('search', [
      transition(':enter', [
        style({ opacity: '0', width: '0' }),
        animate('500ms ease-out', style({ opacity: '1', width: '*' })),
      ]),
      transition(':leave', [
        style({ opacity: '1', width: '*' }),
        animate('500ms ease-in', style({ opacity: '0', width: '0' })),
      ]),
    ]),

    trigger('magnifier', [
      state(
        'open',
        style({
          'margin-right': '21.2em',
          'margin-left': 0,
        }),
      ),
      state('closed', style({})),
      transition('open => closed', [animate('0.7s')]),
      transition('closed => open', [animate('0.4s')]),
    ]),
  ],
})
export class FollowersAndFollowingComponent implements OnInit, OnChanges {
  //ввод
  @Input() userPage: IUser = nullUser;
  @Input() currentUser: IUser = nullUser;
  @Input() followers: IUser[] = [];
  @Input() following: IUser[] = [];

  followersDisplay: IUser[] = [];
  followingDisplay: IUser[] = [];

  //вывод: для закрытия окна
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  //что смотрим
  @Input() object: 'followers' | 'following' = 'followers';
  searchMode: boolean = false;
  currentUserFollowingIds: number[] = []; //подписки авторизованного пользователя
  searchQuery: string = '';
  constructor(
    private router: Router,
    public userService: UserService,
  ) {}
  ngOnChanges(): void {
    if (this.following) this.followingDisplay = this.following;

    if (this.followers) this.followersDisplay = this.followers;
  }

  ngOnInit(): void {
    this.userService.getUsers().subscribe((data) => {
      if (this.currentUser?.id) {
        const currentUserFollowing = this.userService.getFollowing(
          data,
          this.currentUser?.id,
        );

        currentUserFollowing?.forEach((currFollowing) => {
          this.currentUserFollowingIds.push(currFollowing.id);
        });
      }
    });
  }

  //подписка текущего пользователя на людей в списке
  follow(user: IUser) {
    this.userService.addFollower(user, this.currentUser?.id);
    this.updateUser(user);
    //обновляем список подписок авторизованного пользователя
    this.currentUserFollowingIds?.push(user?.id);

    if (this.userPage?.id === this.currentUser?.id) {
      this.following?.push(user);
      this.followingDisplay?.push(user);
    }
  }

  //отписка текущего пользователя от людей в списке
  unfollow(user: IUser) {
    this.userService.removeFollower(user, this.currentUser?.id);
    this.updateUser(user);
    //обновляем список подписок авторизованного пользователя
    let indexToDelete: number  =
      this.currentUserFollowingIds?.findIndex((us: number) => us === user.id);
    if (indexToDelete !== -1 && indexToDelete) {
      this.currentUserFollowingIds?.splice(indexToDelete, 1);
    }

    if (this.userPage?.id === this.currentUser?.id) {
      indexToDelete = this.following?.findIndex((us: IUser) => us.id === user.id);

      this.following.splice(indexToDelete, 1);
      this.followingDisplay.splice(indexToDelete, 1);
    }
  }

  searchOnOff() {
    this.searchMode = !this.searchMode;
    this.followingDisplay = this.following;
    this.followersDisplay = this.followers;
    this.searchQuery = '';
  }

  updateUser(user: IUser) {
    this.userService.updateUser(user).subscribe((updatingUser) => {
      this.followers = this.followers?.map((follower: IUser) => {
        if (follower.id === updatingUser.id) {
          follower = updatingUser;
          return updatingUser;
        } else return follower;
      });

      this.following = this.following?.map((follower: IUser) => {
        if (follower.id === updatingUser.id) return updatingUser;
        else return follower;
      });
    });
  }

  //переход по ссылке на человека
  goToFollowerAccount(uri: string) {
    this.router.navigateByUrl(uri);
    this.closeEmitter.emit(true)
  }

  filter() {
    if (this.object === 'followers') {
      if (this.searchQuery) {
        this.followersDisplay = this.followers.filter(
          (follower: IUser) =>
            follower.fullName
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            follower.username
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()),
        );
      } else {
        this.followersDisplay = this.followers; // Если поле поиска пустое, показать всех подписчиков
      }
    } else {
      if (this.searchQuery) {
        this.followingDisplay = this.following.filter(
          (follower: IUser) =>
            follower.fullName
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            follower.username.toLowerCase().includes(this.searchQuery),
        );
      } else {
        this.followingDisplay = this.following; // Если поле поиска пустое, показать всех подписчиков
      }
    }
  }
}
