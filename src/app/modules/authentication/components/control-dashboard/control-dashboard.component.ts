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
  currentUser: IUser = { ...nullUser };

  sections: ISection[] = [];
  users: IUser[] = [];
  recipes: IRecipe[] = [];
  reports: ICommentReportForAdmin[] = [];

  allReports: ICommentReportForAdmin[] = [];
  actionReport: ICommentReportForAdmin | null = null;
  actionCategory: ICategory | null = null;

  awaitingRecipes: IRecipe[] = [];
  awaitingRecipesToShow: IRecipe[] = [];

  reportCommentDismissModalShow: boolean = false;
  successReportCommentDismissModalShow: boolean = false;
  reportCommentApproveModalShow: boolean = false;
  successReportCommentApproveModalShow: boolean = false;

  dismissCategoryActionModalShow: boolean = false;
  approveCategoryActionModalShow: boolean = false;

  successApproveCategoryModalShow = false;
  successDismissCategoryModalShow = false;

  showCommentReports: boolean = false;

  sectionCreatingMode = false;

  showCategoriesForCheck: boolean = false;
  categoriesForCheckToShow: ICategory[] = [];
  categoriesForCheck: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();
  showAwaitingRecipes: boolean = false;
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

  ngOnInit(): void {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.categoriesForCheck = data.filter(
          (item) => item.status === 'awaits',
        );
        if (this.categoriesForCheckToShow.length !== 3)
          this.categoriesForCheckToShow = this.categoriesForCheck.slice(
            0,
            this.categoriesForCheck.length,
          );
        else {
          this.categoriesForCheckToShow = this.categoriesForCheck.slice(0, 3);
        }
        this.cd.markForCheck();
      });
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((users) => {
        this.users = users;
      });
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes: IRecipe[]) => {
        const reportsLengthBefore = this.reports.length;
        this.allReports = [];
        receivedRecipes.forEach((recipe) => {
          if (recipe.reports)
            recipe.reports.forEach((element) => {
              const reportForAdmin: ICommentReportForAdmin = {
                ...element,
                recipeId: recipe.id,
              };
              this.allReports = [...this.allReports, reportForAdmin];
            });
          if (reportsLengthBefore !== 0)
            this.reports = this.allReports.slice(0, reportsLengthBefore);
          else this.reports = this.allReports.slice(0, 3);
        });
        this.recipes = receivedRecipes;
        this.awaitingRecipes =
          this.recipeService.getAwaitingRecipes(receivedRecipes);
        if (this.awaitingRecipesToShow.length > 3) {
          this.awaitingRecipesToShow = this.awaitingRecipes.slice(
            0,
            this.awaitingRecipesToShow.length,
          );
        } else {
          this.awaitingRecipesToShow = this.awaitingRecipes.slice(0, 3);
        }
        this.cd.markForCheck();
        this.awaitingRecipesToShow = this.awaitingRecipes;
      });
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
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedSections: ISection[]) => {
        {
          this.sections = receivedSections;
        }
      });
  }

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

  approveCategory() {
    if (this.actionCategory) {
      this.actionCategory.status = 'public';
      this.categoryService.updateCategory(this.actionCategory).subscribe(() => {
        if (this.actionCategory) {
          this.successApproveCategoryModalShow = true;
          const author: IUser = this.getUser(this.actionCategory?.authorId);
          const link: string = '/categories/list/' + this.actionCategory.id;
          const title =
            'Твоя категория «' +
            this.actionCategory.name +
            '» одобрена и теперь может просматриваться всеми кулинарами';
          const notify: INotification = this.notifyService.buildNotification(
            'Категория одобрена',
            title,
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

      this.categoryService.deleteCategory(this.actionCategory.id).subscribe({
        next: () => {
          this.sectionService.updateSections(section).subscribe({
            next: () => {
              this.successDismissCategoryModalShow = true;
              if (this.actionCategory) {
                const author: IUser = this.getUser(
                  this.actionCategory?.authorId,
                );
                const title =
                  'Твоя категория «' + this.actionCategory.name + '» отклонена';
                const notify: INotification =
                  this.notifyService.buildNotification(
                    'Категория отклонена',
                    title,
                    'error',
                    'category',
                    '',
                  );
                this.notifyService.sendNotification(notify, author).subscribe();
              }
              this.cd.markForCheck();
            },
          });
        },
      });
    }
  }
  handleSuccessApproveCategoryModal() {
    this.successApproveCategoryModalShow = false;
  }
  handleSuccessDismissCategoryModal() {
    this.successDismissCategoryModalShow = false;
  }

  getUser(userId: number): IUser {
    const find = this.users.find((item) => item.id === userId);
    if (find) return find;
    return nullUser;
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

  
            


  blockComment() {


    const report = this.actionReport;
    
    if (report) {
      const recipe = this.getRecipe(report.recipeId);

      this.recipeService
        .updateRecipe({
          ...recipe,
          comments: recipe.comments.filter(
            (item) => item.id !== report.commentId,
          ),
          reports: recipe.reports.filter(
            (item) => item.commentId !== report.commentId,
          ),
        })
        .subscribe(() => {
          this.successReportCommentApproveModalShow = true;

          if (this.actionReport) {
            const recipe: IRecipe = this.getRecipe(this.actionReport.recipeId);
            const reporter: IUser = this.getUser(this.actionReport.reporterId);
            const comment: IComment = this.getComment(
              this.actionReport.commentId,
              recipe,
            );
              const author: IUser = this.getUser(
                this.getComment(this.actionReport.commentId, recipe).authorId,
              );
            const title1 =
              'Твой комментарий «' +
              comment.text +
              '» под рецептом «' +
              recipe.name +
              '» удален по жалобе';

            const title2 =
              'Твоя жалоба на комментарий пользователя ' + (author.fullName
                ? author.fullName
                : ('@' +
                  author.username)) +
                  ' «' +
                  comment.text +
                  '» под рецептом «' +
                  recipe.name +
                  '» принята';
            const notify1: INotification = this.notifyService.buildNotification(
              'Твой комментарий удален по жалобе',
              title1,
              'error',
              'comment',
              '/recipes/list/' + recipe.id,
            );
            const notify2: INotification = this.notifyService.buildNotification(
              'Комментарий удален по твоей жалобе',
              title2,
              'success',
              'comment',
              '/recipes/list/'+recipe.id
            )
            this.notifyService.sendNotification(notify1, author).subscribe();
            this.notifyService.sendNotification(notify2, reporter).subscribe();
          }
              this.actionReport = null;

        });
    }
  }

  reportActionClick(
    action: 'approve' | 'dismiss',
    report: ICommentReportForAdmin,
  ) {
    if (action === 'approve') {
      this.reportCommentApproveModalShow = true;
    } else {
      this.reportCommentDismissModalShow = true;
    }
    this.actionReport = report;
  }

  leaveComment() {
    const report = this.actionReport;

    if (report) {
      const recipe = this.getRecipe(report.recipeId);

      this.recipeService
        .updateRecipe({
          ...recipe,
          reports: recipe.reports.filter(
            (item) => item.commentId !== report.commentId,
          ),
        })
        .subscribe(() => {
          this.successReportCommentDismissModalShow = true
        
          if (this.actionReport) {
            const recipe: IRecipe = this.getRecipe(this.actionReport.recipeId);
            const reporter: IUser = this.getUser(this.actionReport.reporterId);
            const comment: IComment = this.getComment(
              this.actionReport.commentId,
              recipe,
            );
            const author: IUser = this.getUser(
              this.getComment(this.actionReport.commentId, recipe).authorId,
            );
           
            const title =
              'Твоя жалоба на комментарий пользователя ' + (author.fullName
                ? author.fullName
                : '@' +
                  author.username +
                  ' «') +
                  comment.text +
                  '» под рецептом «' +
                  recipe.name +
                  '» отклонена';
          
            const notify: INotification = this.notifyService.buildNotification(
              'Жалоба на комментарий отклонена',
              title,
              'error',
              'comment',
              '/recipes/list/' + recipe.id,
            );
            this.notifyService.sendNotification(notify, reporter).subscribe();
          }
              this.actionReport = null;

        });
    }
  }

  getAuthorOfReportedComment(report: ICommentReportForAdmin): IUser {
    return this.getUser(
      this.getComment(report.commentId, this.getRecipe(report.recipeId))
        .authorId,
    );
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

  awaitingRecipeActionClick(action: 'approve' | 'dismiss', recipe: IRecipe) {
    if (action === 'approve') {
      this.approveRecipeModalShow = true;
    } else {
      this.dismissRecipeModalShow = true;
    }
    this.actionRecipe = recipe;
  }

  successRecipeActionModalShow: boolean = false;
  dismissRecipeModalShow = false;
  approveRecipeModalShow = false;
  adminAction: 'approve' | 'dismiss' = 'dismiss';
  actionRecipe: null | IRecipe = null;

  
            

              
    

  handleSuccessRecipeActionModal() {
    this.successRecipeActionModalShow = false;

    if (this.actionRecipe) {
      if (this.adminAction === 'approve') {
        const approvedRecipe = this.recipeService.approveRecipe(
          this.actionRecipe,
        );
        this.recipeService.updateRecipe(approvedRecipe).subscribe(
          () => {
            if (this.actionRecipe) {
              const author: IUser = this.getUser(this.actionRecipe?.authorId);
              const title =
                'Твой рецепт «' +
                this.actionRecipe.name +
                '» одобрен и теперь может просматриваться всеми кулинарами';
              const notify: INotification =
                this.notifyService.buildNotification(
                  'Рецепт одобрен',
                  title,
                  'success',
                  'recipe',
                  '/recipes/list/' + this.actionRecipe.id,
                );
              this.notifyService.sendNotification(notify, author).subscribe();
            }
          }
        
        );
      } else {
        const dismissedRecipe = this.recipeService.dismissRecipe(
          this.actionRecipe,
        );
        this.recipeService.updateRecipe(dismissedRecipe).subscribe(
          () => {
            if (this.actionRecipe) {
              const author: IUser = this.getUser(this.actionRecipe?.authorId);
              const title =
                'Твой рецепт «' + this.actionRecipe.name + '» отклонен';
              const notify: INotification =
                this.notifyService.buildNotification(
                  'Рецепт отклонен',
                  title,
                  'error',
                  'recipe',
                  '',
                );
              this.notifyService.sendNotification(notify, author).subscribe();
            }
      }
    
        );
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
