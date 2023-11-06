import { trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { slide, slideReverse, modal, heightAnim } from 'src/tools/animations';
import { IUser, nullUser } from '../../models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
import { IPlan } from 'src/app/modules/planning/models/plan';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  animations: [
    trigger('slide', slide()),
    trigger('slideReverse', slideReverse()),
    trigger('modal', modal()),
    trigger('heightAnim', heightAnim()),
  ],
})
export class SettingsComponent implements OnInit {
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() user: IUser = { ...nullUser };

  currentPage: number = 0;
  exitModalShow: boolean = false;
  deleteModalShow: boolean = false;
  location = '';
  nightMode = false;
  private users: IUser[] = [];
  private plans: IPlan[] = [];
  private recipes: IRecipe[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private recipeService: RecipeService,
    private userService: UserService,
    private planService: PlanService,
  ) {
    this.location = 'https://' + window.location.host;
  }

  public ngOnInit(): void {
    this.recipeService.recipes$.subscribe(
      (receivedRecipes:IRecipe[]) => this.recipes = receivedRecipes
    )
    this.userService.users$.subscribe(
      (receivedUsers: IUser[]) => (this.users = receivedUsers),
    );
    this.planService.plans$.subscribe(
      (receivedPlans: IPlan[]) => (this.plans = receivedPlans),
    );
  }

  nightModeEmit(event: boolean) {
    this.nightMode = event;
    if (this.nightMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  handleExitModal(event: boolean) {
    if (event) {
      this.authService.logoutUser();
      this.router.navigateByUrl('/');
    }
    this.exitModalShow = false;
  }

  handleDeleteModal(event: boolean) {
    
    if (event) {
                                this.authService.logoutUser();

      if (this.user.id !== 0 && this.users.find((u) => u.id === this.user.id)) {
        //находим рецепты с лайками комментами приготовлениями  и тп от удаляемого пользователя
        const editedRecipes =
          this.recipeService.getRecipesWhithIsEditedWhenUserDeleting(
            this.recipes,
            this.user,
          );
        //обновляем эти рецепты очищая упоминания о пользователе
        editedRecipes.forEach((recipe) => {
          this.recipeService.updateRecipe(recipe).subscribe();
        });
        //находим все не публичные рецепты пользователя(публичные останутся с authorId -1 )
        const deletingRecipes =
          this.recipeService.getRecipesThatWillBeDeletedAfterUserDeleting(
            this.recipes,
            this.user,
          );
        //удаляем все такие рецепты и обновляем планы пользователей в связи с этим
        deletingRecipes.forEach((recipe) => {
          this.planService.updatePlansAfterDeletingRecipe(
            this.plans,
            this.users,
            recipe,
          );
          this.recipeService.deleteRecipe(recipe).subscribe();
        });
        //удаляем полностью план удаляемого пользователя
        const deletingUserPlan = this.plans.find(
          (p) => p.user === this.user.id,
        );
        if (deletingUserPlan)
          this.planService.deletePlan(deletingUserPlan).subscribe();

        const usersForUpdate =
          this.userService.getUsersWhichWillBeUpdatedWhenUserDeleting(
            this.users,
            this.user,
          );
        usersForUpdate.forEach((u) =>
          this.userService.updateUser(u).subscribe(),
        );

        //удаляем наконец пользователя

        this.userService.deleteUser(this.user).subscribe();

          this.router.navigateByUrl('/');
        
      }
    }
    this.deleteModalShow = false;
  }

  clickBackgroundNotContent(elem: Event) {
    //обработка нажатия на фон настроек, но не на блок с настройками
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  showSocialShare = false;
}
