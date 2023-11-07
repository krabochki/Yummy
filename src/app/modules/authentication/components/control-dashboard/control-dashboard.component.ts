import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import {
  ICategory,
  ISection,
  nullSection,
} from 'src/app/modules/recipes/models/categories';
import { ChangeDetectionStrategy } from '@angular/core';
import { SectionService } from 'src/app/modules/recipes/services/section.service';
import { Subject, takeUntil } from 'rxjs';
import {
  IComment,
  ICommentReportForAdmin,
  nullComment,
} from 'src/app/modules/recipes/models/comments';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
@Component({
  selector: 'app-control-dashboard',
  templateUrl: './control-dashboard.component.html',
  styleUrls: ['./control-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class ControlDashboardComponent implements OnInit, OnDestroy {
  protected currentUser: IUser = { ...nullUser };

  private sections: ISection[] = [];
  private users: IUser[] = [];
  private recipes: IRecipe[] = [];
  protected reports: ICommentReportForAdmin[] = [];

  protected managers: IUser[] = [];
  protected targetDemotedUser: IUser = nullUser;
  protected showManagers: boolean = false;

  //расскрыт ли раздел
  protected showCommentReports: boolean = false;
  protected showAwaitingRecipes: boolean = false;
  protected showCategoriesForCheck: boolean = false;

  protected adminAction: 'approve' | 'dismiss' = 'dismiss';

  protected allReports: ICommentReportForAdmin[] = [];
  protected actionReport: ICommentReportForAdmin | null = null;

  protected actionCategory: ICategory | null = null;
  protected categoriesForCheckToShow: ICategory[] = [];
  protected categoriesForCheck: ICategory[] = [];

  protected actionRecipe: null | IRecipe = null;
  protected awaitingRecipes: IRecipe[] = [];
  protected awaitingRecipesToShow: IRecipe[] = [];

  protected sectionCreatingMode: boolean = false;

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

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private authService: AuthService,
    private userService: UserService,
    private sectionService: SectionService,
    private categoryService: CategoryService,
    private notifyService: NotificationService,
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

  protected demote(user: IUser) {
    this.targetDemotedUser = user;
    this.demoteModalShow = true;
  }

  protected getName(user: IUser): string {
    return user.fullName ? user.fullName : '@' + user.username;
  }
  protected handleDemoteModal(answer: boolean) {
    if (answer) {
      this.targetDemotedUser.role = 'user';
      const notify: INotification = this.notifyService.buildNotification(
        'Вас разжаловали',
        `Вы теперь не являетесь модератором сайта Yummy. Вас разжаловал администратор ${this.getName(
          this.currentUser,
        )}`,
        'warning',
        'demote',
        `/cooks/list/${this.currentUser.id}`,
      );
      this.userService.updateUsers(this.targetDemotedUser).subscribe();
      this.notifyService
        .sendNotification(notify, this.targetDemotedUser)
        .subscribe();
      this.demoteSuccessModalShow = true;
    } else {
      this.targetDemotedUser = nullUser;
    }
    this.demoteModalShow = false;
  }
  protected handleSuccessDemoteModal() {
    this.demoteSuccessModalShow = false;
    this.targetDemotedUser = nullUser;
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
          this.sections = receivedSections;
        }
      });
  }

  //Загрузить больше чего-то ...

  loadMoreCommentReports() {
    const currentLength = this.reports.length;
    const nextRecipes = this.allReports.slice(currentLength, currentLength + 3);
    this.reports = [...this.reports, ...nextRecipes];
  }

  loadMoreAwaitingRecipes() {
    const currentLength = this.awaitingRecipesToShow.length;
    const nextRecipes = this.awaitingRecipes.slice(
      currentLength,
      currentLength + 3,
    );
    this.awaitingRecipesToShow = [
      ...this.awaitingRecipesToShow,
      ...nextRecipes,
    ];
  }

  loadMoreCategories() {
    const currentLength = this.categoriesForCheckToShow.length;
    const nextRecipes = this.categoriesForCheck.slice(
      currentLength,
      currentLength + 3,
    );
    this.categoriesForCheckToShow = [
      ...this.categoriesForCheckToShow,
      ...nextRecipes,
    ];
  }

  //Модальные окна

  handleApproveCategoryModal(event: boolean) {
    if (event) {
      this.approveCategory();
    }
    this.approveCategoryActionModalShow = false;
  }
  handleDismissCategoryModal(event: boolean) {
    if (event) {
      this.dismissCategory();
    }
    this.dismissCategoryActionModalShow = false;
  }
  handleSuccessApproveCategoryModal() {
    this.successApproveCategoryModalShow = false;
  }
  handleSuccessDismissCategoryModal() {
    this.successDismissCategoryModalShow = false;
  }
  handleReportCommentDismissModal(event: boolean) {
    if (event) this.leaveComment();
    this.reportCommentDismissModalShow = false;
  }
  handleReportCommentApproveModal(event: boolean) {
    if (event) this.blockComment();
    this.reportCommentApproveModalShow = false;
  }
  handleSuccessReportCommentDismissModal() {
    this.successReportCommentDismissModalShow = false;
  }
  handleSuccessReportCommentApproveModal() {
    this.successReportCommentApproveModalShow = false;
  }
  handleDismissRecipeModal(answer: boolean): void {
    if (answer) {
      this.adminAction = 'dismiss';

      this.successRecipeActionModalShow = true;
    }
    this.dismissRecipeModalShow = false;
  }
  handleApproveRecipeModal(answer: boolean): void {
    if (answer) {
      this.adminAction = 'approve';
      this.successRecipeActionModalShow = true;
    }
    this.approveRecipeModalShow = false;
  }
  handleSuccessRecipeActionModal() {
    this.successRecipeActionModalShow = false;

    if (this.actionRecipe) {
      if (this.adminAction === 'approve') {
        this.approveRecipe();
      } else {
        this.dismissRecipe();
      }
    }
  }

  //Получить конкретный экземпляр

  getAuthorOfReportedComment(report: ICommentReportForAdmin): IUser {
    return this.getUser(
      this.getComment(report.comment, this.getRecipe(report.recipe)).authorId,
    );
  }
  getUser(userId: number): IUser {
    const find = this.users.find((item) => item.id === userId);
    if (find) return find;
    return { ...nullUser };
  }
  getSection(category: number): ISection {
    const find = this.sections.find((section) =>
      section.categories.includes(category),
    );
    if (find) return find;
    else return nullSection;
  }
  getComment(commentId: number, recipe: IRecipe): IComment {
    const find = recipe.comments.find((item) => item.id === commentId);
    if (find) return find;
    return nullComment;
  }
  getRecipe(recipeId: number): IRecipe {
    const find = this.recipes.find((item) => item.id === recipeId);
    if (find) return find;
    else return nullRecipe;
  }

  //Работа с категориями

  approveCategory() {
    if (this.actionCategory) {
      this.actionCategory.status = 'public';
      this.categoryService.updateCategory(this.actionCategory).subscribe(() => {
        if (this.actionCategory) {
          this.successApproveCategoryModalShow = true;
          const author: IUser = this.getUser(this.actionCategory?.authorId);
          const link: string = '/categories/list/' + this.actionCategory.id;
          const notify: INotification = this.notifyService.buildNotification(
            'Категория одобрена',
            `Твоя категория «${this.actionCategory.name}» одобрена и теперь может просматриваться всеми кулинарами`,
            'success',
            'category',
            link,
          );
          this.notifyService.sendNotification(notify, author).subscribe();
          this.cd.markForCheck();
        }
      });
    }
  }
  dismissCategory() {
    if (this.actionCategory) {
      const section = { ...this.getSection(this.actionCategory.id) };
      section.categories = section.categories.filter(
        (categoryId) => categoryId !== this.actionCategory?.id,
      );

      this.categoryService
        .deleteCategory(this.actionCategory.id)
        .subscribe(() => {
          this.sectionService.updateSections(section).subscribe(() => {
            this.successDismissCategoryModalShow = true;
          });
          if (this.actionCategory) {
            const author: IUser = this.getUser(this.actionCategory?.authorId);
            const notify: INotification = this.notifyService.buildNotification(
              'Категория отклонена',
              `Твоя категория «${this.actionCategory.name}» отклонена`,
              'error',
              'category',
              '',
            );
            this.notifyService.sendNotification(notify, author).subscribe();
            this.cd.markForCheck();
          }
        });
    }
  }

  //Работа с категориями
  private blockComment(): void {
    const report = this.actionReport;

    if (report) {
      const comment = this.getComment(
        report.comment,
        this.getRecipe(report.recipe),
      );
      const recipe = this.getRecipe(report.recipe);

      this.recipeService
        .updateRecipe({
          ...recipe,
          comments: recipe.comments.filter(
            (item) => item.id !== report.comment,
          ),
          reports: recipe.reports.filter(
            (item) => item.comment !== report.comment,
          ),
        })
        .subscribe(() => {
          this.successReportCommentApproveModalShow = true;
          if (this.actionReport) {
            const recipe: IRecipe = this.getRecipe(report.recipe);
            const reporter: IUser = this.getUser(report.reporter);
            const author: IUser = this.getUser(comment.authorId);
            const notify1: INotification = this.notifyService.buildNotification(
              'Твой комментарий удален по жалобе',
              `Твоя комментарий «${comment.text}» под рецептом « ${recipe.name} » удален по жалобе`,
              'error',
              'comment',
              '/recipes/list/' + recipe.id,
            );
            const notify2: INotification = this.notifyService.buildNotification(
              'Комментарий удален по твоей жалобе',
              `Твоя жалоба на комментарий пользователя ${
                author.fullName ? author.fullName : '@' + author.username
              } «${comment.text}» под рецептом «${recipe.name}» принята`,
              'success',
              'comment',
              '/recipes/list/' + recipe.id,
            );
            this.notifyService.sendNotification(notify2, reporter).subscribe();
            this.notifyService.sendNotification(notify1, author).subscribe();
          }
        });
    }
  }
  private leaveComment(): void {
    const report = this.actionReport;

    if (report) {
      const recipe = this.getRecipe(report.recipe);

      this.recipeService
        .updateRecipe({
          ...recipe,
          reports: recipe.reports.filter(
            (item) => item.comment !== report.comment,
          ),
        })
        .subscribe(() => {
          this.successReportCommentDismissModalShow = true;

          if (this.actionReport) {
            const recipe: IRecipe = this.getRecipe(this.actionReport.recipe);
            const reporter: IUser = this.getUser(this.actionReport.reporter);
            const comment: IComment = this.getComment(
              this.actionReport.comment,
              recipe,
            );
            const author: IUser = this.getUser(
              this.getComment(
                this.actionReport.comment,
                this.getRecipe(this.actionReport.recipe),
              ).authorId,
            );

            let notify: INotification = this.notifyService.buildNotification(
              'Жалоба на комментарий отклонена',
              `Твоя жалоба на комментарий пользователя ${
                author.fullName ? author.fullName : '@' + author.username
              } «${comment.text}» под рецептом «${recipe.name}» отклонена`,
              'error',
              'comment',
              '/recipes/list/' + recipe.id,
            );
            this.notifyService.sendNotification(notify, reporter).subscribe();


            notify = this.notifyService.buildNotification(
              'Жалоба на комментарий отклонена',
              `Жалоба на ваш комментарий «${comment.text}» под рецептом «${
                recipe.name
              }» отклонена модератором. Комментарий сохранен!`,
              'info',
              'comment',
              '/recipes/list/' + recipe.id,
            );
            this.notifyService.sendNotification(notify, author).subscribe();
          }
          this.actionReport = null;
        });
    }
  }
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

  //Работа с рецептами
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
  private approveRecipe(): void {
    if (this.actionRecipe) {
      const approvedRecipe = this.recipeService.approveRecipe(
        this.actionRecipe,
      );
      this.recipeService.updateRecipe(approvedRecipe).subscribe(() => {
        if (this.actionRecipe) {
          const recipeAuthor: IUser = this.getUser(this.actionRecipe?.authorId);
          const notify: INotification = this.notifyService.buildNotification(
            'Рецепт одобрен',
            `Твой рецепт «${this.actionRecipe.name}» одобрен и теперь может просматриваться всеми кулинарами`,
            'success',
            'recipe',
            '/recipes/list/' + this.actionRecipe.id,
          );
          this.notifyService.sendNotification(notify, recipeAuthor).subscribe();
        }
      });
    }
  }
  private dismissRecipe(): void {
    if (this.actionRecipe) {
      const dismissedRecipe = this.recipeService.dismissRecipe(
        this.actionRecipe,
      );
      this.recipeService.updateRecipe(dismissedRecipe).subscribe(() => {
        if (this.actionRecipe) {
          const recipeAuthor: IUser = this.getUser(this.actionRecipe?.authorId);
          const notify: INotification = this.notifyService.buildNotification(
            'Рецепт отклонен',
            `Твой рецепт «${this.actionRecipe.name}» отклонен`,
            'error',
            'recipe',
            '',
          );
          this.notifyService.sendNotification(notify, recipeAuthor).subscribe();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
