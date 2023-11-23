import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import {
  condifencialitySettings,
  managersPreferences,
  sections,
  social,
  steps,
  stepsIcons,
} from './conts';
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
  stepsIcons = stepsIcons;

  protected permanentIngredient: string = '';
  protected permanentIngredientTouched = false;
  protected excludedIngredient: string = '';
  protected excludedIngredientTouched = false;

  MANAGERS_SETTINGS_BLOCK_NUM = 4;

  protected exitModalShow: boolean = false;
  protected deleteModalShow: boolean = false;
  protected permanentIngredients: string[] = [];
  protected excludingIngredients: string[] = [];

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
    private cd:ChangeDetectorRef,
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
    this.updateUser(this.user)
  }

  showBlock(i: number) {
    if (this.user.role === 'user' && i === this.MANAGERS_SETTINGS_BLOCK_NUM)
      return false;
    return true;
  }

  protected addPermanentIngredient(): void {
    if (!this.user.permanent) this.user.permanent = [];
    this.user.permanent.push(this.permanentIngredient);
    this.updateUser(this.user)
    this.permanentIngredientTouched = false;
    this.permanentIngredient = '';
  }

  protected addExcludedIngredient(): void {
    if (!this.user.exclusions) this.user.exclusions = [];
    this.user.exclusions.push(this.excludedIngredient);
    this.updateUser(this.user)
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
            const favicon = document.querySelector('#favicon');
            favicon?.setAttribute('href', 'assets/images/chef-day.png');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
            const favicon = document.querySelector('#favicon');
            favicon?.setAttribute('href', 'assets/images/chef-night.png');

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
    this.updateUser(this.user)
  }

  async handleExitModal(event: boolean) {
    this.exitModalShow = false;
    if (event) {
      this.loading = true;
      await this.authService.logout();
      this.authService.logoutUser();
      this.loading = false;
      this.router.navigateByUrl('/');
    } else {
      setTimeout(() => {
        this.addModalStyle();
      });
    }
  }

  async deleteRecipe(recipe: IRecipe) {
    await this.recipeService.removeRecipeFunction(recipe.id);
  }

  async handleDeleteModal(event: boolean) {
    this.deleteModalShow = false;

    if (event) {    this.loading = true;

      this.authService.logoutUser();
      await this.authService.logout()

      if (this.user.id !== 0 && this.users.find((u) => u.id === this.user.id)) {
        //находим рецепты с лайками комментами приготовлениями  и тп от удаляемого пользователя
        const editedRecipes =
          this.recipeService.getRecipesWhithIsEditedWhenUserDeleting(
            this.recipes,
            this.user,
          );
        //обновляем эти рецепты очищая упоминания о пользователе
        editedRecipes.forEach((recipe) => {
          this.updateRecipe(recipe);
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

          this.deleteRecipe(recipe);
        });
        //удаляем полностью план удаляемого пользователя
        const deletingUserPlan = this.plans.find(
          (p) => p.user === this.user.id,
        );
        if (deletingUserPlan)
          await this.planService.deletePlanFromSupabase(deletingUserPlan.id);

        const usersForUpdate =
          this.userService.getUsersWhichWillBeUpdatedWhenUserDeleting(
            this.users,
            this.user,
          );
        usersForUpdate.forEach((u) => this.updateUser(u));

        //удаляем наконец пользователя
        await this.userService.deleteUserFromSupabase(this.user.id);
        await this.authService.deleteUserFromSupabase();
            this.loading = false;

        this.router.navigateByUrl('/');


      }
    } else {
      setTimeout(() => {
        this.addModalStyle();
      });
    }
  }

  loading = false;

  async deleteUser() {
    this.loading = true;
    await this.authService.deleteUserFromSupabase();
    this.loading = false;
  }
  async updateUser(user: IUser) {
    this.loading = true;
    this.cd.markForCheck()
    await this.userService.updateUserInSupabase(user);
    this.loading = false;    this.cd.markForCheck();

  }

  async updateRecipe(recipe: IRecipe) {
    await this.recipeService.updateRecipeFunction(recipe);
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
