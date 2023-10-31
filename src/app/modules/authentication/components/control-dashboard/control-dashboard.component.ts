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
import { HttpClient } from '@angular/common/http';
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

  reportCommentDismissModalShow: boolean = false;
  successReportCommentDismissModalShow: boolean = false;
  reportCommentApproveModalShow: boolean = false;
  successReportCommentApproveModalShow: boolean = false;

  dismissCategoryActionModalShow: boolean = false;
  approveCategoryActionModalShow: boolean = false;

  successApproveCategoryModalShow = false;
  successDismissCategoryModalShow = false;

  showCommentReports: boolean = false;

  showCategoriesForCheck: boolean = false;
  categoriesForCheckToShow: ICategory[] = [];
  categoriesForCheck: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private authService: AuthService,
    private userService: UserService,
    private sectionService: SectionService,
    private http: HttpClient,
    private categoryService: CategoryService,
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
        this.cd.markForCheck();
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
      this.categoryService
        .updateCategory(this.actionCategory)
        .subscribe(() => (this.successApproveCategoryModalShow = true));
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

  notApproveRecipe(id: number): void {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'private';
      this.recipeService
        .updateRecipe(approvedRecipe)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          () => {
            this.awaitingRecipes = this.awaitingRecipes.filter(
              (recipe) => recipe.id !== id,
            );
          },
          (error) => {
            console.error(
              'Произошла ошибка при обновлении статуса рецепта модератором: ',
              error,
            );
          },
        );
    }
  }

  approveRecipe(id: number): void {
    const approvedRecipe: IRecipe | undefined = this.awaitingRecipes.find(
      (recipe: IRecipe) => recipe.id === id,
    );

    if (approvedRecipe) {
      approvedRecipe.status = 'public';
      this.recipeService
        .updateRecipe(approvedRecipe)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          () => {
            this.awaitingRecipes = this.awaitingRecipes.filter(
              (recipe) => recipe.id !== id,
            );
          },
          (error) => {
            console.error(
              'Произошла ошибка при обновлении статуса рецепта модератором: ',
              error,
            );
          },
        );
    }
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
        .subscribe(() => (this.successReportCommentApproveModalShow = true));
    }
    this.actionReport = null;
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
        .subscribe(() => (this.successReportCommentDismissModalShow = true));
    }
    this.actionReport = null;
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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
