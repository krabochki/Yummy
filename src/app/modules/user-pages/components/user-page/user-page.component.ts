import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser } from '../../models/users';
import {
  ActivatedRoute,
  Data,
  Router,
  RoutesRecognized,
} from '@angular/router';
import { UserService } from '../../services/user.service';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { fadeIn, modal } from 'src/tools/animations';
import { trigger } from '@angular/animations';
import { Title } from '@angular/platform-browser';
import { RouteEventsService } from 'src/app/modules/controls/route-events.service';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';

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

  currentUser: IUser = {
    id: 0,
  };
  settingsShow = false;

  user: IUser | undefined = undefined;
  userId: number = 0;

  userRecipes: IRecipe[] = [];

  allRecipes: IRecipe[] = [];

  userFollowers: IUser[] | null = [];
  userFollowing: IUser[] | null = [];

  myPage: boolean = false;

  likes: number = 0;
  cooks: number = 0;
  comments: number = 0;
  profileViews: number = 0;

  ngOnInit() {
    window.scrollTo(0, 0);
    this.route.params.subscribe((params: Data) => {
      this.userId = params['id'];
    });

    this.authService.getCurrentUser()?.subscribe((data) => {
      this.currentUser = data!;
    });
    if (!this.currentUser) {
      this.currentUser = {
        id: 0,
      };
    }

    this.userService.getUsers().subscribe((data) => {
      this.user = data.find((user) => user.id == this.userId);

      if (this.user?.profileViews) this.profileViews = this.user?.profileViews;

      if (this.user?.username)
        this.titleService.setTitle('@' + this.user.username);

      if (this.currentUser?.id == this.user?.id) {
        this.myPage = true;
      }

      this.userFollowers = this.userService.getFollowers(data, this.userId);

      this.userFollowing = this.userService.getFollowing(data, this.userId);
    });

    this.recipeService.getRecipes()?.subscribe((data) => {
      this.allRecipes = data;

      this.userRecipes = this.recipeService.getRecipesByUser(
        this.allRecipes,
        this.userId,
      );

      this.userRecipes.forEach((recipe) => {
        this.cooks += recipe.cooksId?.length;
        this.likes += recipe.likesId?.length;
        this.comments += recipe.comments?.length;
        if (!this.cooks) this.cooks = 0;
        if (!this.likes) this.likes = 0;
        if (!this.comments) this.comments = 0;
      });

      setTimeout(() => {
        this.dataLoaded = true;
      }, 800);
    });
  }

  onSkipHandler() {
    this.router.navigate([this.routerEventsService.previousRoutePath.value]);
  }

  settingsClose(event:boolean) {
    this.settingsShow = false;
  }

  username: string = 'username';
}
