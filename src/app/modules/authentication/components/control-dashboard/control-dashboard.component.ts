/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import {
  IUser,
  PermissionContext,
  nullUser,
} from 'src/app/modules/user-pages/models/users';
import { IRecipe } from 'src/app/modules/recipes/models/recipes';
import {
  ICategory,
  ISection,
  nullSection,
} from 'src/app/modules/recipes/models/categories';
import { ChangeDetectionStrategy } from '@angular/core';
import { SectionService } from 'src/app/modules/recipes/services/section.service';
import { EMPTY, Observable, Subject, forkJoin, takeUntil } from 'rxjs';
import {
  IComment,
  ICommentReportForAdmin,
} from 'src/app/modules/recipes/models/comments';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { AdminService } from '../../services/admin.service';
import {
  getAuthorOfReportedComment,
  getComment,
  getRecipe,
  getUser,
} from './quick-actions';
import {
  getName,
  notifyForAuthorOfApprovedCategory,
  notifyForAuthorOfApprovedRecipe,
  notifyForAuthorOfBlockedComment,
  notifyForAuthorOfDismissedCategory,
  notifyForAuthorOfDismissedRecipe,
  notifyForAuthorOfIngredient,
  notifyForAuthorOfLeavedComment,
  notifyForDemotedUser,
  notifyForFollowersOfApprovedRecipeAuthor,
  notifyForReporterOfBlockedComment,
  notifyForReporterOfLeavedComment,
} from './notifications';
import { IngredientService } from 'src/app/modules/recipes/services/ingredient.service';
import {
  IIngredient,
  IIngredientsGroup,
} from 'src/app/modules/recipes/models/ingredients';
import { baseComparator } from 'src/tools/common';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
@Component({
  selector: 'app-control-dashboard',
  templateUrl: './control-dashboard.component.html',
  styleUrls: ['./control-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class ControlDashboardComponent implements OnInit, OnDestroy {
  protected currentUser: IUser = { ...nullUser };

  protected sections: ISection[] = [];
  protected sectionsToShow: ISection[] = [];
  private users: IUser[] = [];
  private recipes: IRecipe[] = [];
  protected reports: ICommentReportForAdmin[] = [];
  protected managers: IUser[] = [];
  groups: IIngredientsGroup[] = [];
  showedGroups: IIngredientsGroup[] = [];

  protected targetDemotedUser: IUser = nullUser;
  protected showManagers: boolean = false;

  //расскрыт ли раздел
  protected showCommentReports: boolean = false;
  protected showAwaitingRecipes: boolean = false;
  protected showCategoriesForCheck: boolean = false;
  protected showSections: boolean = false;
  showGroups: boolean = false;

  protected adminAction: 'approve' | 'dismiss' = 'dismiss';

  protected allReports: ICommentReportForAdmin[] = [];
  protected actionReport: ICommentReportForAdmin | null = null;

  protected actionCategory: ICategory | null = null;
  protected categoriesForCheckToShow: ICategory[] = [];
  protected categoriesForCheck: ICategory[] = [];

  protected actionRecipe: null | IRecipe = null;
  protected awaitingRecipes: IRecipe[] = [];
  protected awaitingRecipesToShow: IRecipe[] = [];

  actionIngredient: null | IIngredient = null;
  allAwaitingIngredients: IIngredient[] = [];
  showedAwaitingIngredients: IIngredient[] = [];

  showAwaitingIngredients: boolean = false;

  protected sectionCreatingMode: boolean = false;
  groupCreatingMode = false;

  categoryPlaceholder = 'assets/images/category.png';

  protected reportCommentDismissModalShow: boolean = false;
  protected successReportCommentDismissModalShow: boolean = false;
  protected reportCommentApproveModalShow: boolean = false;
  protected successReportCommentApproveModalShow: boolean = false;
  protected successRecipeActionModalShow: boolean = false;
  protected dismissRecipeModalShow: boolean = false;
  protected approveRecipeModalShow: boolean = false;
  protected dismissCategoryActionModalShow: boolean = false;
  protected approveCategoryActionModalShow: boolean = false;
  protected successApproveCategoryModalShow: boolean = false;
  protected successDismissCategoryModalShow: boolean = false;
  protected demoteModalShow = false;
  protected demoteSuccessModalShow = false;

  recipeArVariants = ['рецепт', 'рецепта', 'рецептов'];
  reportsArVariants = ['жалоба', 'жалобы', 'жалоб'];
  categoriesArVariants = ['категория', 'категории', 'категорий'];
  ingredientsArVariants = ['ингредиент', 'ингредиента', 'ингредиентов'];

  ingredientAction: 'approve' | 'dismiss' | null = null;
  ingredientModalShow: boolean = false;
  successIngredientModalShow: boolean = false;

  START_INGREDIENTS_DISPLAY_SIZE = 3;
  START_SECTIONS_DISPLAY_SIZE = 10;
  SECTIONS_TO_LOAD_SIZE = 3;
  START_INGREDIENTS_GROUPS_DISPLAY_SIZE = 10;

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private cd: ChangeDetectorRef,
    private adminService: AdminService,
    private titleService: Title,
    private authService: AuthService,
    private userService: UserService,
    private sectionService: SectionService,
    private categoryService: CategoryService,
    private notifyService: NotificationService,
    private ingredientService: IngredientService,
  ) {}

  public ngOnInit(): void {
    this.initAllData();
  }

  private initAllData(): void {
    this.categoriesInit();
    this.usersInit();
    this.recipesInit();
    this.currentUserInit();
    this.sectionsInit();
    this.ingredientsInit();
  }

  getDate(date: string) {
    console.log(new Date(date));
    return new Date(date);
  }

  private ingredientsInit(): void {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedIngredients: IIngredient[]) => {
        this.allAwaitingIngredients = receivedIngredients.filter(
          (ingredient) => ingredient.status === 'awaits',
        );
        this.showedAwaitingIngredients = this.allAwaitingIngredients.slice(
          0,
          this.START_INGREDIENTS_DISPLAY_SIZE,
        );
      });
    this.ingredientService.ingredientsGroups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedGroups: IIngredientsGroup[]) => {
        this.groups = receivedGroups;
        this.showedGroups = this.groups.slice(
          0,
          this.START_INGREDIENTS_GROUPS_DISPLAY_SIZE,
        );
        this.cd.markForCheck();
      });
  }

  private recipesInit(): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes: IRecipe[]) => {
        this.allReports = [];
        receivedRecipes.forEach((recipe) => {
          if (recipe.reports)
            recipe.reports.forEach((element) => {
              const reportForAdmin: ICommentReportForAdmin = {
                ...element,
                recipe: recipe.id,
              };
              this.allReports = [...this.allReports, reportForAdmin];
            });

          this.reports = this.allReports.slice(
            0,
            this.reports.length > 3 ? this.reports.length : 3,
          );
        });
        this.recipes = receivedRecipes;
        this.awaitingRecipes =
          this.recipeService.getAwaitingRecipes(receivedRecipes);
        this.awaitingRecipesToShow = this.awaitingRecipes.slice(
          0,
          this.awaitingRecipesToShow.length > 3
            ? this.awaitingRecipesToShow.length
            : 3,
        );
        this.awaitingRecipesToShow = this.awaitingRecipes;
        this.cd.markForCheck();
      });
  }

  private usersInit(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((users) => {
        this.users = users;
        this.managers = users.filter((element) => element.role === 'moderator');
      });
  }

  private categoriesInit(): void {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.categoriesForCheck = data.filter(
          (item) => item.status === 'awaits',
        );

        this.categoriesForCheckToShow = this.categoriesForCheck.slice(
          0,
          this.categoriesForCheckToShow.length > 3
            ? this.categoriesForCheckToShow.length
            : 3,
        );
        this.cd.markForCheck();
      });
  }

  private currentUserInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        {
          this.currentUser = receivedUser;
          this.titleService.setTitle(
            this.currentUser.role === 'moderator'
              ? 'Панель модератора'
              : 'Панель администратора',
          );
        }
      });
  }

  private sectionsInit(): void {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedSections: ISection[]) => {
        {
          this.sections = receivedSections.sort((a, b) =>
            baseComparator(a.name, b.name),
          );
          this.sectionsToShow = this.sections.slice(
            0,
            this.START_SECTIONS_DISPLAY_SIZE,
          );
          this.cd.markForCheck();
        }
      });
  }

  //Загрузить больше чего-то ...
  private loadMore(all: any[], current: any[], amount: number): any[] {
    const currentLength = current.length;
    const next = all.slice(currentLength, currentLength + amount);
    return (current = [...current, ...next]);
  }
  protected loadMoreCategories(): void {
    this.categoriesForCheckToShow = this.loadMore(
      this.categoriesForCheck,
      this.categoriesForCheckToShow,
      this.SECTIONS_TO_LOAD_SIZE,
    );
  }

  loadMoreGroups(): void {
    this.showedGroups = this.loadMore(
      this.groups,
      this.showedGroups,
      this.SECTIONS_TO_LOAD_SIZE,
    );
  }

  loadMoreAwaitingIngredients(): void {
    this.showedAwaitingIngredients = this.loadMore(
      this.allAwaitingIngredients,
      this.showedAwaitingIngredients,
      this.SECTIONS_TO_LOAD_SIZE,
    );
  }
  protected loadMoreSections(): void {
    this.sectionsToShow = this.loadMore(this.sections, this.sectionsToShow, 4);
  }

  protected loadMoreCommentReports(): void {
    this.reports = this.loadMore(this.allReports, this.reports, 3);
  }
  protected loadMoreAwaitingRecipes(): void {
    this.awaitingRecipesToShow = this.loadMore(
      this.awaitingRecipes,
      this.awaitingRecipesToShow,
      3,
    );
  }

  protected handleApproveCategoryModal(event: boolean): void {
    if (event) {
      this.approveCategory();
    }
    this.approveCategoryActionModalShow = false;
  }
  protected handleDismissCategoryModal(event: boolean): void {
    if (event) {
      this.dismissCategory();
    }
    this.dismissCategoryActionModalShow = false;
  }
  protected handleReportCommentDismissModal(event: boolean): void {
    if (event) this.leaveComment();
    this.reportCommentDismissModalShow = false;
  }
  protected handleReportCommentApproveModal(event: boolean): void {
    if (event) this.blockComment();
    this.reportCommentApproveModalShow = false;
  }
  protected handleDismissRecipeModal(answer: boolean): void {
    if (answer) {
      this.adminAction = 'dismiss';
      this.successRecipeActionModalShow = true;
    }
    this.dismissRecipeModalShow = false;
  }
  protected handleApproveRecipeModal(answer: boolean): void {
    if (answer) {
      this.adminAction = 'approve';
      this.successRecipeActionModalShow = true;
    }
    this.approveRecipeModalShow = false;
  }
  protected handleDemoteModal(answer: boolean): void {
    if (answer) {
      this.demoteSuccessModalShow = true;
    } else {
      this.targetDemotedUser = nullUser;
    }
    this.demoteModalShow = false;
  }

  protected handleSuccessApproveCategoryModal(): void {
    this.successApproveCategoryModalShow = false;
    this.sendNotifyAfterApproveCategory();
  }
  protected handleSuccessRecipeActionModal(): void {
    this.successRecipeActionModalShow = false;

    if (this.actionRecipe) {
      if (this.adminAction === 'approve') {
        this.approveRecipe();
      } else {
        this.dismissRecipe();
      }
    }
  }
  protected handleSuccessDemoteModal(): void {
    this.demoteSuccessModalShow = false;
    this.demoteUser();
  }
  protected handleSuccessReportCommentDismissModal(): void {
    this.successReportCommentDismissModalShow = false;
    this.sendNotifiesAfterDismissedReport();
  }
  protected handleSuccessReportCommentApproveModal(): void {
    this.successReportCommentApproveModalShow = false;
    this.sendNotifiesAfterApprovingReport();
  }
  protected handleSuccessDismissCategoryModal(): void {
    this.successDismissCategoryModalShow = false;
    this.sendNotifyAfterDismissCategory();
  }

  private sendNotifiesAfterDismissedReport(): void {
    if (this.actionReport) {
      const recipe: IRecipe = this.getRecipe(this.actionReport.recipe);
      const reporter: IUser = this.getUser(this.actionReport.reporter);
      const comment: IComment = this.getComment(
        this.actionReport.comment,
        recipe,
      );
      const author: IUser = this.getUser(comment.authorId);

      const notifyForReporter = notifyForReporterOfLeavedComment(
        author,
        recipe,
        comment,
        this.notifyService,
      );
      this.sendNotifyWithPermission(
        notifyForReporter,
        reporter,
        'your-reports-publish',
      );

      const notifyForAuthor = notifyForAuthorOfLeavedComment(
        comment,
        recipe,
        this.notifyService,
      );
      this.sendNotifyWithPermission(
        notifyForAuthor,
        author,
        'your-reports-reviewed-moderator',
      );
    }
  }
  private sendNotifiesAfterApprovingReport(): void {
    if (this.actionReport) {
      const recipe: IRecipe = this.getRecipe(this.actionReport.recipe);
      const reporter: IUser = this.getUser(this.actionReport.reporter);
      const comment: IComment = this.getComment(
        this.actionReport.comment,
        recipe,
      );

      const author: IUser = this.getUser(comment.authorId);

      const notifyForAuthor = notifyForAuthorOfBlockedComment(
        comment,
        recipe,
        this.notifyService,
      );
      const notifyForReporter = notifyForReporterOfBlockedComment(
        comment,
        recipe,
        author,
        this.notifyService,
      );

      this.sendNotifyWithPermission(
        notifyForReporter,
        reporter,
        'your-reports-publish',
      ),
        this.sendNotifyWithPermission(
          notifyForAuthor,
          author,
          'your-reports-reviewed-moderator',
        );
    }
  }
  private sendNotifyAfterApproveCategory(): void {
    if (this.actionCategory) {
      const author: IUser = this.getUser(this.actionCategory.authorId);
      const notify = notifyForAuthorOfApprovedCategory(
        this.actionCategory,
        this.notifyService,
      );
      this.sendNotifyWithPermission(
        notify,
        author,
        'manager-reviewed-your-category',
      );
    }
  }
  private sendNotifyAfterDismissCategory(): void {
    if (this.actionCategory) {
      const author: IUser = this.getUser(this.actionCategory.authorId);
      const notifyForAuthor = notifyForAuthorOfDismissedCategory(
        this.actionCategory,
        this.notifyService,
      );
      this.sendNotifyWithPermission(
        notifyForAuthor,
        author,
        'manager-reviewed-your-category',
      );
    }
  }
  async sendNotifiesAfterPublishingRecipe(approvedRecipe: IRecipe) {
    if (this.actionRecipe) {
      const author: IUser = this.getUser(this.actionRecipe.authorId);
      {
        const notifyForAuthor: INotification = notifyForAuthorOfApprovedRecipe(
          this.actionRecipe,
          this.notifyService,
        );
        await this.sendNotifyWithPermission(
          notifyForAuthor,
          author,
          'manager-review-your-recipe',
        );

        const authorFollowers = this.userService.getFollowers(
          this.users,
          author.id,
        );
        authorFollowers.forEach((follower) => {
          const notifyForFollower = notifyForFollowersOfApprovedRecipeAuthor(
            author,
            approvedRecipe,
            this.notifyService,
          );
            this.sendNotifyWithPermission(
             notifyForFollower,
             follower,
             'new-recipe-from-following',
           );
        });
      }
    }
  }

  async updateUser(user: IUser) {
    await this.userService.updateUserInSupabase(user);
  }

  private demoteUser() {
    this.targetDemotedUser.role = 'user';
    if (
      this.userService.getPermission('you-was-fired', this.targetDemotedUser)
    ) {
      this.targetDemotedUser = this.notifyService.addNotificationToUser(
        notifyForDemotedUser(this.currentUser, this.notifyService),
        this.targetDemotedUser,
      );
    }
    this.updateUser(this.targetDemotedUser);
  }

  downloadCategoryPicFromSupabase(path: string) {
    return supabase.storage.from('categories').getPublicUrl(path).data
      .publicUrl;
  }

  private approveCategory() {
    if (this.actionCategory) {
      this.adminService.approveCategory(this.actionCategory);
      this.successApproveCategoryModalShow = true;
    }
  }
  private dismissCategory() {
    if (this.actionCategory) {
      this.adminService.dismissCategory(this.actionCategory);
      if (this.actionCategory) {
        const section = { ...this.getSection(this.actionCategory.id) };
        this.adminService.updateSectionAfterDismissCategory(
          section,
          this.actionCategory,
        );
        this.successDismissCategoryModalShow = true;
      }
    }
  }
  async approveRecipe() {
    if (this.actionRecipe) await this.adminService.approveRecipe(this.actionRecipe);
    this.actionRecipe &&
      this.userService.getPermission(
        'hide-author',
        this.getUser(this.actionRecipe.authorId),
      ) &&
     await this.sendNotifiesAfterPublishingRecipe(this.actionRecipe);
  }
  private dismissRecipe(): void {
    if (this.actionRecipe) {
      this.adminService.dismissRecipe(this.actionRecipe);
      if (this.actionRecipe) {
        const author: IUser = this.getUser(this.actionRecipe.authorId);
        const notify = notifyForAuthorOfDismissedRecipe(
          this.actionRecipe,
          this.notifyService,
        );
        this.sendNotifyWithPermission(
          notify,
          author,
          'manager-review-your-recipe',
        );
      }
    }
  }
  private blockComment(): void {
    if (this.actionReport) {
      this.adminService.blockComment(this.actionReport, this.recipes);
      this.successReportCommentApproveModalShow = true;
    }
  }
  private leaveComment(): void {
    if (this.actionReport) {
      const recipe = this.getRecipe(this.actionReport.recipe);
      this.adminService.leaveComment(recipe, this.actionReport);
      this.successReportCommentDismissModalShow = true;
    }
  }

  //клики по кнопкам
  protected reportActionClick(
    action: 'approve' | 'dismiss',
    report: ICommentReportForAdmin,
  ): void {
    if (action === 'approve') {
      this.reportCommentApproveModalShow = true;
    } else {
      this.reportCommentDismissModalShow = true;
    }
    this.actionReport = report;
  }

  awaitingIngredientActionClick(
    action: 'approve' | 'dismiss',
    ingredient: IIngredient,
  ) {
    this.actionIngredient = ingredient;
    if (action === 'approve') {
      this.ingredientAction = 'approve';
    } else {
      this.ingredientAction = 'dismiss';
    }
    this.ingredientModalShow = true;
  }

  categoryActionClick(context: 'approve' | 'dismiss', category: ICategory) {
    this.actionCategory = category;
    if (context === 'approve') this.approveCategoryActionModalShow = true;
    else this.dismissCategoryActionModalShow = true;
  }
  getIngredientModalDescription(): string {
    if (this.actionIngredient && this.actionIngredient.author) {
      const verb =
        this.ingredientAction === 'approve' ? 'одобрить' : 'отклонить';

      return `Вы уверены, что хотите ${verb} ингредиент 
              «${this.actionIngredient.name}» автора 
              ${this.getName(this.getUser(this.actionIngredient.author))}?`;
    }
    return '';
  }

  getSuccessIngredientModalDescription(): string {
    if (this.actionIngredient && this.actionIngredient.author) {
      const verb =
        this.ingredientAction === 'approve' ? 'одобрили' : 'отклонили';

      return `Вы успешно ${verb} ингредиент 
              «${this.actionIngredient.name}» автора 
              ${this.getName(this.getUser(this.actionIngredient.author))}!`;
    }
    return '';
  }

  handleIngredientModal(answer: boolean) {
    if (answer) {
      if (this.ingredientAction === 'approve') {
        this.approveIngredient();
      } else {
        this.dismissIngredient();
        this.successIngredientModalShow = true;
        this.cd.markForCheck();
      }
    }
    this.ingredientModalShow = false;
  }

  private sendNotifyToIngredientAuthor() {
    if (
      this.actionIngredient &&
      this.actionIngredient.author &&
      this.ingredientAction
    ) {
      const notify: INotification = notifyForAuthorOfIngredient(
        this.actionIngredient,
        this.ingredientAction,
        this.notifyService,
      );
      this.sendNotifyWithPermission(
        notify,
        this.getUser(this.actionIngredient.author),
        'your-ingredient-published',
      );
    }
  }

  private approveIngredient() {
    if (this.actionIngredient) {
      this.adminService.approveIngredient(this.actionIngredient);
      this.successIngredientModalShow = true;
      this.cd.markForCheck();
    }
  }

  private dismissIngredient() {
    if (this.actionIngredient) {
      this.adminService.dismissIngredient(this.actionIngredient);
      this.adminService.updateIngredientGroupsAfterDismissingIngredient(
        this.actionIngredient,
        this.groups,
      );
    }
  }

  handleSuccessIngredientModal() {
    this.successIngredientModalShow = false;
    this.sendNotifyToIngredientAuthor();
  }

  protected awaitingRecipeActionClick(
    action: 'approve' | 'dismiss',
    recipe: IRecipe,
  ): void {
    if (action === 'approve') {
      this.approveRecipeModalShow = true;
    } else {
      this.dismissRecipeModalShow = true;
    }
    this.actionRecipe = recipe;
  }
  protected demoteActionClick(user: IUser) {
    this.targetDemotedUser = user;
    this.demoteModalShow = true;
  }

  async sendNotifyWithPermission(
    notify: INotification,
    user: IUser,
    permission?: PermissionContext,
  ) {
    if (permission) {
      if (this.userService.getPermission(permission, user))
        await this.notifyService.sendNotification(notify, user);

    }
    else {
      await this.notifyService.sendNotification(notify, user);
    }
  }

  //Получить конкретный экземпляр
  protected getAuthorOfReportedComment(report: ICommentReportForAdmin): IUser {
    return getAuthorOfReportedComment(report, this.users, this.recipes);
  }
  protected getSection(category: number): ISection {
    return (
      this.sections.find((section) => section.categories.includes(category)) ||
      nullSection
    );
  }
  protected getComment(commentId: number, recipe: IRecipe): IComment {
    return getComment(commentId, recipe);
  }
  protected getRecipe(recipeId: number): IRecipe {
    return getRecipe(recipeId, this.recipes);
  }
  protected getUser(userId: number): IUser {
    return getUser(userId, this.users);
  }

  protected getName(user: IUser): string {
    return getName(user);
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
