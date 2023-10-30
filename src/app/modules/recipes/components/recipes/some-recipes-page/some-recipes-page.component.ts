import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { IRecipe } from '../../../models/recipes';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { ICategory, nullCategory } from '../../../models/categories';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import {
  RecipeType,
  recipeNoRecipesButtonText,
  recipeNoRecipesText,
  recipeNoRecipesRouterLinkText,
  recipeTitles,
} from './consts';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-some-recipes-page',
  templateUrl: './some-recipes-page.component.html',
  styleUrls: [
    './some-recipes-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
})
export class SomeRecipesPageComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private authService: AuthService,
    private userService: UserService,
    private title: Title,
    private router: Router,
  ) {}

  dataLoad: boolean = false;
  creatingMode = false;
  filter: string = '';
  recipesToShow: IRecipe[] = [];
  allRecipes: IRecipe[] = [];
  category: ICategory = nullCategory;
  recentRecipes: IRecipe[] = [];
  popularRecipes: IRecipe[] = [];
  discussedRecipes: IRecipe[] = [];
  commentedRecipes: IRecipe[] = [];
  myRecipes: IRecipe[] = [];
  likedRecipes: IRecipe[] = [];
  cookedRecipes: IRecipe[] = [];
  favoriteRecipes: IRecipe[] = [];
  followingRecipes: IRecipe[] = [];
  currentUser: IUser = { ...nullUser };
  searchQuery: string = '';
  autocompleteShow: boolean = false;
  autocomplete: IRecipe[] = [];
  allUsers: IUser[] = [];
  currentUserFollowing: IUser[] = [];
  recipeType: RecipeType = RecipeType.All;
  protected destroyed$: Subject<void> = new Subject<void>();

  getTitleByRecipeType(recipeType: RecipeType): string {
    if (recipeType === RecipeType.Category) {
      return this.category.name;
    }
    return recipeTitles[recipeType] || '';
  }
  getNoRecipesTextByRecipetype(recipeType: RecipeType): string {
    return recipeNoRecipesText[recipeType] || '';
  }
  getNoRecipesButtonTextByRecipetype(recipeType: RecipeType): string {
    return recipeNoRecipesButtonText[recipeType] || '';
  }
  getNoRecipesRouterLinkTextByRecipetype(recipeType: RecipeType): string {
    return recipeNoRecipesRouterLinkText[recipeType] || '';
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  setRecipeType(filter: string): void {
    switch (filter) {
      case 'recent':
        this.recipeType = RecipeType.Recent;
        break;
      case 'all':
        this.recipeType = RecipeType.All;
        break;
      case 'my-recipes':
        this.recipeType = RecipeType.My;
        break;
      case 'favorite':
        this.recipeType = RecipeType.Favorite;
        break;
      case 'popular':
        this.recipeType = RecipeType.Popular;
        break;
      case 'liked':
        this.recipeType = RecipeType.Liked;
        break;
      case 'cooked':
        this.recipeType = RecipeType.Cooked;
        break;
      case 'category-recipes':
        this.recipeType = RecipeType.Category;
        break;
      case 'updates':
        this.recipeType = RecipeType.Updates;
        break;
      case 'discussed':
        this.recipeType = RecipeType.Discussed;
        break;
      case 'commented':
        this.recipeType = RecipeType.Commented;
        break;
    }
  }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.filter = data['filter'];
      this.setRecipeType(this.filter);

      if (this.recipeType === RecipeType.Category) {
        this.category = data['CategoryResolver'];
        this.recipeService.recipes$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((data) => {
            this.authService.currentUser$
              .pipe(takeUntil(this.destroyed$))
              .subscribe((user: IUser) => {
                this.currentUser = user;

                const publicAndMyRecipes =
                  this.recipeService.getPublicAndAllMyRecipes(
                    data,
                    this.currentUser.id,
                  );
                this.allRecipes = this.recipeService.getRecipesByCategory(
                  publicAndMyRecipes,
                  this.category.id,
                );
                this.recipesToShow = this.allRecipes.slice(0, 8);
              });
          });
      } else {
        this.authService.currentUser$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((user: IUser) => {
            this.currentUser = user;
            this.userService.users$
              .pipe(takeUntil(this.destroyed$))
              .subscribe((data) => {
                this.allUsers = data;
              });
            this.recipeService.recipes$
              .pipe(takeUntil(this.destroyed$))
              .subscribe((data) => {
                const publicRecipes = this.recipeService.getPublicRecipes(data);
                switch (this.recipeType) {
                  case RecipeType.Discussed:
                    this.allRecipes =
                      this.recipeService.getMostDiscussedRecipes(publicRecipes);
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.Popular:
                    this.allRecipes =
                      this.recipeService.getPopularRecipes(publicRecipes);
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.Updates:
                    this.allRecipes = this.getFollowingRecipes(publicRecipes);
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.Recent:
                    this.allRecipes =
                      this.recipeService.getRecentRecipes(publicRecipes);
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.My:
                    this.allRecipes = this.recipeService.getRecipesByUser(
                      data,
                      this.currentUser.id,
                    );
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.Favorite:
                    this.allRecipes =
                      this.recipeService.getFavoriteRecipesByUser(
                        data,
                        this.currentUser.id,
                      );
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.Commented:
                    this.allRecipes = this.recipeService
                      .getCommentedRecipesByUser(publicRecipes, this.currentUser.id)
                    
                            this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.Liked:
                    this.allRecipes = this.recipeService.getLikedRecipesByUser(
                      publicRecipes,
                      this.currentUser.id,
                    );
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.Cooked:
                    this.allRecipes = this.recipeService.getCookedRecipesByUser(
                      publicRecipes,
                      this.currentUser.id,
                    );
                    this.recipesToShow = this.allRecipes.slice(0, 8);
                    break;
                  case RecipeType.All:
                    this.allRecipes = publicRecipes;
                    this.recipesToShow = publicRecipes;
                    this.popularRecipes = this.recipeService
                      .getPopularRecipes(this.allRecipes)
                      .slice(0, 8);
                    this.discussedRecipes = this.recipeService
                      .getMostDiscussedRecipes(publicRecipes)
                      .slice(0, 8);
                    this.commentedRecipes = this.recipeService
                      .getCommentedRecipesByUser(publicRecipes, user.id)
                      .slice(0, 8);

                    this.recentRecipes = this.recipeService
                      .getRecentRecipes(this.allRecipes)
                      .slice(0, 8);
                    this.cookedRecipes = this.recipeService
                      .getCookedRecipesByUser(this.allRecipes, user.id)
                      .slice(0, 8);
                    this.likedRecipes = this.recipeService
                      .getLikedRecipesByUser(this.allRecipes, user.id)
                      .slice(0, 8);
                    this.favoriteRecipes = this.recipeService
                      .getFavoriteRecipesByUser(this.allRecipes, user.id)
                      .slice(0, 8);

                    this.myRecipes = this.recipeService.getRecipesByUser(
                      data,
                      this.currentUser.id,
                    );

                    this.followingRecipes = this.getFollowingRecipes(
                      publicRecipes,
                    ).slice(0, 8);

                    this.allRecipes = [...this.allRecipes, ...this.myRecipes];

                    break;
                }
              });
          });
      }
      this.dataLoad = true;
    });
    this.title.setTitle(this.getTitleByRecipeType(this.recipeType));
  }

  loadMoreRecipes() {
    const currentLength = this.recipesToShow.length;
    const nextRecipes = this.allRecipes.slice(currentLength, currentLength + 4);
    this.recipesToShow = [...this.recipesToShow, ...nextRecipes];
  }

  getFollowingRecipes(recipes: IRecipe[]): IRecipe[] {
    const currentUserFollowings: IUser[] = this.userService.getFollowing(
      this.allUsers,
      this.currentUser.id,
    );
    let followingRecipes: IRecipe[] = [];

    currentUserFollowings.forEach((following) => {
      let foundRecipes = this.recipeService.getRecipesByUser(
        recipes,
        following.id,
      );
      foundRecipes = this.recipeService.getRecentRecipes(foundRecipes);
      followingRecipes = [...followingRecipes, ...foundRecipes];
    });

    return followingRecipes;
  }

  searchOff() {
    this.searchQuery = '';
  }

  blur() {
    this.autocompleteShow = false;
  }
  getUser(userId: number): IUser {
    const finded = this.allUsers.find((user) => user.id === userId);
    if (finded) return finded;
    return { ...nullUser };
  }

  focus() {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }
  search() {
    this.autocompleteShow = true;
    const recipeAuthors: IUser[] = [];
    this.allRecipes.forEach((element) => {
      recipeAuthors.push(this.getUser(element.authorId));
    });
    if (this.searchQuery && this.searchQuery !== '') {
      this.autocomplete = [];

      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      const filterRecipes: IRecipe[] = this.allRecipes.filter(
        (recipe: IRecipe) =>
          recipe.name.toLowerCase().replace(/\s/g, '').includes(search) ||
          this.getUser(recipe.authorId)
            .fullName.toLowerCase()
            .replace(/\s/g, '')
            .includes(search) ||
          this.getUser(recipe.authorId)
            .username.toLowerCase()
            .replace(/\s/g, '')
            .includes(search),
      );

      filterRecipes.forEach((element) => {
        this.autocomplete.push(element);
      });
    } else this.autocompleteShow = false;
  }
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
