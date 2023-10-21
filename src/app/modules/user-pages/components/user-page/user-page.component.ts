import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from '../../models/users';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { fadeIn, modal } from 'src/tools/animations';
import { trigger } from '@angular/animations';
import { Title } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { RouteEventsService } from 'src/app/modules/controls/route-events.service';

@Component({
  selector: 'app-user-page',
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss', './skeleton.scss'],
  animations: [trigger('fadeIn', fadeIn()), trigger('modal', modal())],
})
export class UserPageComponent implements OnInit {
  recipesEnabled: boolean = false;
  moreInfoEnabled: boolean = true;

  obj: 'following' | 'followers' = 'followers';

  dataLoaded = false;

  showFollows = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  closeFollows(event: any) {
    this.showFollows = false;
  }

  linkForSocials: string = '';
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    public userService: UserService,
    private recipeService: RecipeService,
    private titleService: Title,
    public router: Router,
    public routerEventsService: RouteEventsService,
  ) {
    registerLocaleData(localeRu);
    this.linkForSocials = window.location.href;
  }

  onSkipHandler() {
    this.router.navigate([this.routerEventsService.previousRoutePath.value]);
  }

  currentUser: IUser = nullUser;
  settingsShow = false;

  user: IUser = nullUser;

  userId: number = 0;

  userRecipes: IRecipe[] = [];

  allRecipes: IRecipe[] = [];

  userFollowers: IUser[] = [];
  userFollowing: IUser[] = [];

  myPage: boolean = false;

  likes: number = 0;
  cooks: number = 0;
  comments: number = 0;
  users: IUser[] = [];
  ngOnInit() {
    this.route.data.subscribe((data: Data) => {
      this.user = data['user'];
      this.userId = this.user.id;
      this.recipesEnabled = false;
      this.moreInfoEnabled = true;

      this.titleService.setTitle('@' + this.user.username);

      this.authService.getCurrentUser().subscribe((data) => {
        this.currentUser = data;
      });

      if (this.currentUser.id === this.user.id) {
        this.myPage = true;
      } else {
        this.myPage = false;
      }

      this.userFollowers = this.userService.getFollowers(
        this.users,
        this.userId,
      );

      this.userFollowing = this.userService.getFollowing(
        this.users,
        this.userId,
      );

      this.userService.getUsers().subscribe((data) => {
        this.users = data;
        const findedUser = data.find((user) => user.id === this.userId);

        if (findedUser) this.user = findedUser;

        this.titleService.setTitle('@' + this.user.username);

        if (this.currentUser.id === this.user.id) {
          this.myPage = true;
        }

        this.user.profileViews++;
        if (this.myPage) {
          this.currentUser.profileViews++;
        }

        this.authService.setCurrentUser(this.currentUser);

        this.updateUser();

        this.userFollowers = this.userService.getFollowers(data, this.userId);

        this.userFollowing = this.userService.getFollowing(data, this.userId);
      });

      this.recipeService.getRecipes()?.subscribe((data) => {
        this.allRecipes = this.recipeService.getPopularRecipes(data);

        this.userRecipes = this.recipeService.getRecipesByUser(
          this.allRecipes,
          this.userId,
        );
        if (
          !this.myPage &&
          (this.currentUser.role === 'admin' ||
            this.currentUser.role === 'moderator')
        ) {
          console.log('Я админ или модер и это не моя страница');

          this.userRecipes = this.recipeService.getNotPrivateRecipes(
            this.userRecipes,
          );
        } else if (
          !this.myPage &&
          this.currentUser.role !== 'admin' &&
          this.currentUser.role !== 'moderator'
        ) {
          console.log('Я  не админ и не модер и это не моя страница');

          this.userRecipes = this.recipeService.getPublicRecipes(
            this.userRecipes,
          );
        }

        this.userRecipes.forEach((recipe) => {
          this.cooks += recipe.cooksId?.length;
          this.likes += recipe.likesId?.length;
          this.comments += recipe.comments?.length;
          if (!this.cooks) this.cooks = 0;
          if (!this.likes) this.likes = 0;
          if (!this.comments) this.comments = 0;
        });

        this.displayRecipes = [...this.userRecipes];

        if (this.displayRecipes.length == 2) {
          this.displayRecipes.push(nullRecipe);
        }
        if (this.displayRecipes.length == 1) {
          this.displayRecipes.push(nullRecipe);
          this.displayRecipes.push(nullRecipe);
        }

        setTimeout(() => {
          this.dataLoaded = true;
        }, 700);
      });
    });
    this.router.events.subscribe(() => {
      window.scrollTo(0, 0);
    });
  }

  displayRecipes: IRecipe[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settingsClose(event: boolean) {
    this.settingsShow = false;
  }

  //подписка текущего пользователя на людей в списке
  follow() {
    this.user = this.userService.addFollower(this.user, this.currentUser.id);
    this.updateUser();

    this.userFollowers.push(this.currentUser);
  }

  unfollow() {
    this.user = this.userService.removeFollower(this.user, this.currentUser.id);
    this.updateUser();

    let indexToDelete: number = 0;

    indexToDelete = this.userFollowers.findIndex(
      (us: IUser) => us.id === this.currentUser.id,
    );
    if (indexToDelete !== -1 && indexToDelete) {
      this.userFollowers.splice(indexToDelete, 1);
    }
  }

  updateUser() {
    this.userService.updateUser(this.user).subscribe();
  }

  username: string = 'username';

  edit() {
    this.editModalShow = !this.editModalShow;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  closeEdit(answer: any) {
    this.editModalShow = false;
  }
  updateCurrentUser(updatedUser: IUser) {
    if (this.user.id === this.currentUser.id) {
      this.user = updatedUser;
      this.currentUser = updatedUser;
    }
    this.updateUser();
    this.titleService.setTitle('@' + this.user.username);

    this.authService.loginUser(this.currentUser).subscribe((userExists) => {
      if (userExists) {
        localStorage.setItem('currentUser', JSON.stringify(userExists));
        this.authService.setCurrentUser(userExists);
      }
    });

    window.scrollTo(0, 0);
  }
  editModalShow: boolean = false;
}
