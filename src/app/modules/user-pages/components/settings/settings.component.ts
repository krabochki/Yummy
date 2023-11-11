import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { IPermission, PermissionContext } from '../../models/users';
import { modal } from 'src/tools/animations';
import { IUser, nullUser } from '../../models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { PlanService } from 'src/app/modules/planning/services/plan-service';
import { IPlan } from 'src/app/modules/planning/models/plan';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import { condifencialitySettings, managersPreferences, sections, social, steps } from './conts';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() user: IUser = { ...nullUser };

  permissionNotificationSections = sections;
  managersPreferences = managersPreferences;
  condifencialitySettings = condifencialitySettings;

  protected permanentIngredient: string = '';
  protected permanentIngredientTouched = false;
  protected excludedIngredient: string = '';
  protected excludedIngredientTouched = false;

  protected exitModalShow: boolean = false;
  protected deleteModalShow: boolean = false;
  protected permanentIngredients: string[] = ['соль', 'сахар', 'вода', 'мука'];
  protected excludingIngredients: string[] = [
    'яйца',
    'сливочное масло',
    'свинина',
  ];

  protected location: string = '';

  private users: IUser[] = [];
  private plans: IPlan[] = [];
  private recipes: IRecipe[] = [];
  private permissions: IPermission[] = [];

  protected socials: social[] = ['pinterest', 'vk', 'twitter', 'facebook'];

  protected steps = steps;
  protected step: number = 0;

  private destroyed$: Subject<void> = new Subject<void>();

    get permanentIngredientExist(): boolean {
    const formattedIngredients = this.permanentIngredients.map((ingredient) =>
      ingredient.trim().toLowerCase(),
    );
    const formattedIngredient = this.permanentIngredient.trim().toLowerCase();
    const isIngredientAlreadyAdded =
      formattedIngredients.includes(formattedIngredient);
    return isIngredientAlreadyAdded;
  }
  get excludedIngredientExist(): boolean {
    const formattedIngredients = this.excludingIngredients.map((ingredient) =>
      ingredient.trim().toLowerCase(),
    );
    const formattedIngredient = this.excludedIngredient.trim().toLowerCase();
    const isIngredientAlreadyAdded =
      formattedIngredients.includes(formattedIngredient);
    return isIngredientAlreadyAdded;
  }


  constructor(
    private authService: AuthService,
    private router: Router,
    private recipeService: RecipeService,
    private renderer: Renderer2,
    private userService: UserService,
    private planService: PlanService,
  ) {
    this.location = 'https://' + window.location.host;
  }

  public ngOnInit(): void {
    this.addModalStyle();
    this.getRecipes();
    this.getUsers();
    this.getPlans();
  }

  deleteIngredient(context: 'permanent' | 'excluding', ingredient: string) {
    if (context === 'permanent') {
      this.permanentIngredients = this.permanentIngredients.filter(
        (i) => i !== ingredient,
      );
      this.user.permanent = this.permanentIngredients;
    } else {
      this.excludingIngredients = this.excludingIngredients.filter(
        (i) => i !== ingredient,
      );
      this.user.exclusions = this.excludingIngredients;
    }
    this.userService.updateUsers(this.user).subscribe();
  }

  protected addPermanentIngredient(): void {
    if (!this.user.permanent) this.user.permanent = [];
    this.user.permanent.push(this.permanentIngredient);
    this.userService.updateUsers(this.user).subscribe();
    this.permanentIngredientTouched = false;
    this.permanentIngredient = '';
  }

  protected addExcludedIngredient(): void {
    if (!this.user.exclusions) this.user.exclusions = [];
    this.user.exclusions.push(this.excludedIngredient);
    this.userService.updateUsers(this.user).subscribe();
    this.excludedIngredientTouched = false;
    this.excludedIngredient = '';
  }



  private getPlans(): void {
    this.planService.plans$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedPlans: IPlan[]) => (this.plans = receivedPlans));
  }

  private getRecipes(): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedRecipes: IRecipe[]) => (this.recipes = receivedRecipes),
      );
  }

  private getUsers(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers: IUser[]) => {
        this.users = receivedUsers;
        if (this.user.id > 0) {
          const updatedCurrentUser = this.users.find(
            (u) => u.id === this.user.id,
          );
          this.user = updatedCurrentUser ? updatedCurrentUser : this.user;
          this.permissions = this.user.permissions ? this.user.permissions : [];
          this.permanentIngredients = this.user.permanent
            ? this.user.permanent
            : [];
          this.excludingIngredients = this.user.exclusions
            ? this.user.exclusions
            : [];
        }
      });
  }

  protected nightModeEmit(nightModeDisabled: boolean) {
    if (!nightModeDisabled) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  } //переключ темной темы

  protected userPermissionEnabled(context: PermissionContext): boolean {
    //разрешены ли конкретные уведомления
    //если уведов нет или оно не установлено то считаю что можно
    if (this.permissions) {
      const findedPermisstion = this.permissions.find(
        (p) => p.context === context,
      );
      if (findedPermisstion) return findedPermisstion.enabled;
    }
    return true;
  }

  protected tooglePermission(
    //изменение значения разрешения на уведомления
    context: PermissionContext,
    enabled: boolean,
  ): void {
    if (!this.user.permissions) this.user.permissions = [];
    const permissionExist = this.permissions.find((p) => p.context === context);
    if (permissionExist) permissionExist.enabled = enabled;
    else {
      const permission: IPermission = { context: context, enabled: enabled };
      this.permissions.push(permission);
    }
    this.user.permissions = this.permissions;
    this.userService.updateUsers(this.user).subscribe();
  }

  protected handleExitModal(event: boolean): void {
    this.exitModalShow = false;
    if (event) {
      this.authService.logoutUser();
      this.router.navigateByUrl('/');
    } else {
      setTimeout(() => {
        this.addModalStyle();
      });
    }
  }

  protected handleDeleteModal(event: boolean): void {
    this.deleteModalShow = false;

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
    } else {
      setTimeout(() => {
        this.addModalStyle();
      });
    }
  }

  protected clickBackgroundNotContent(elem: Event): void {
    //обработка нажатия на фон настроек, но не на блок с настройками
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  //cкрытие/добавление прокрутки к основному содержимому

  private removeModalStyle(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }

  private addModalStyle(): void {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
  }

  public ngOnDestroy(): void {
    this.removeModalStyle();
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
