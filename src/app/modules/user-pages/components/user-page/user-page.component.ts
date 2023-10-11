import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser } from '../../models/users';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
@Component({
  selector: 'app-user-page',
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss'],
})
export class UserPageComponent implements OnInit {
  recipesEnabled: boolean = false;
  moreInfoEnabled: boolean = true;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    public userService: UserService,
    private recipeService: RecipeService,
  ) {}

  currentUser: IUser | null = null;
  user: IUser | undefined = undefined;
  userId: number = 0;

  userRecipes: IRecipe[] = [];
  allRecipes: IRecipe[] = [];

  myPage: boolean = false;

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.userId = params['id'];
    });

    this.authService.getCurrentUser()?.subscribe((data) => {
      this.currentUser = data;
    });

    this.userService.getUsers().subscribe((data) => {
      this.user = data.find((user) => user.id == this.userId);

      if (this.currentUser?.id == this.user?.id) {
        this.myPage = true;
      }
    });

    this.recipeService.getRecipes()?.subscribe((data) => {
      this.allRecipes = data;
    

      this.userRecipes = this.recipeService.getRecipesByUser(
        this.allRecipes,
        this.userId,
      );


    });
    
    


  }

  username: string = 'username';
}
