import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser } from '../../models/users';
import { ActivatedRoute, Data } from '@angular/router';
import { UserService } from '../../services/user.service';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { fadeIn,modal } from 'src/tools/animations';
import {
  trigger,
} from '@angular/animations';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-user-page',
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss', './skeleton.scss'],
  animations: [
    trigger('fadeIn', fadeIn()),
    trigger('modal', modal()),
  ],
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

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    public userService: UserService,
    private recipeService: RecipeService,
    private titleService: Title,
  ) {}

  currentUser: IUser = {
    id: 0,
  };
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
        this.cooks += recipe.cooksId.length;
        this.likes += recipe.likesId.length;
        this.comments += recipe.comments.length;
      });


      setTimeout(() => {
                    this.dataLoaded = true;

      }, 3000);

    });
  }

  username: string = 'username';
}
