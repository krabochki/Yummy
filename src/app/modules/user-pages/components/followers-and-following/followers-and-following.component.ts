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
import { widthAnim } from 'src/tools/animations';

@Component({
  selector: 'app-followers-and-following',
  templateUrl: './followers-and-following.component.html',
  styleUrls: ['./followers-and-following.component.scss'],
  animations: [
    trigger('search', widthAnim()),

    trigger('magnifier', [
      state(
        'open',
        style({
          'margin-right': '20.9em',
          'margin-left': 0,
        }),
      ),
      state('closed', style({})),
      transition('open => closed', [animate('0.7s')]),
      transition('closed => open', [animate('0.4s')]),
    ]),
  ],
})
export class FollowersAndFollowingComponent implements OnInit {
  //ввод
  @Input() userPage: IUser = {...nullUser};
  @Input() currentUser: IUser = {...nullUser};
   followers: IUser[] = [];
  following: IUser[] = [];

  followersDisplay: IUser[] = [];
  followingDisplay: IUser[] = [];

  //вывод: для закрытия окна
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  //что смотрим
  @Input() object: 'followers' | 'following' = 'followers';
  searchMode: boolean = false;
  currentUserFollowingIds: number[] = []; //подписки авторизованного пользователя
  searchQuery: string = '';
  @Input() user: IUser = {...nullUser};
  constructor(
    private router: Router,
    public userService: UserService,
  ) {}


  ngOnInit(): void {
    this.userService.users$.subscribe((data) => {
      this.following = this.userService.getFollowing(data, this.user.id);
      this.followers = this.userService.getFollowers(data, this.user.id);
      this.followingDisplay = this.following;
      this.followersDisplay = this.followers;
      if (this.currentUser.id!==0) {
        const currentUserFollowing = this.userService.getFollowing(
          data,
          this.currentUser?.id,
        );
        this.currentUserFollowingIds = [];
        currentUserFollowing.forEach((currFollowing) => {
          this.currentUserFollowingIds.push(currFollowing.id);
        });
      }
    });
  }

  //подписка текущего пользователя на людей в списке
  follow(user: IUser) {
    this.userService.addFollower(user, this.currentUser?.id);
    this.updateUser(user);
  }

  //отписка текущего пользователя от людей в списке
  unfollow(user: IUser) {
    this.userService.removeFollower(user, this.currentUser?.id);
    this.updateUser(user);
  }

  searchOnOff() {
    this.searchMode = !this.searchMode;
    this.followingDisplay = this.following;
    this.followersDisplay = this.followers;
    this.searchQuery = '';
  }

  updateUser(user: IUser) {
    this.userService.updateUsers(user);
  }

  //переход по ссылке на человека
  goToFollowerAccount(uri: string) {
    this.router.navigateByUrl(uri);
    this.closeEmitter.emit(true);
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
