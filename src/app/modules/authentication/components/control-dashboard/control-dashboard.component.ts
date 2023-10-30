import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { ISection } from 'src/app/modules/recipes/models/categories';
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

  awaitingRecipes: IRecipe[] = [];

  reportCommentDismissModalShow: boolean = false;
  successReportCommentDismissModalShow: boolean = false;
  reportCommentApproveModalShow: boolean = false;
  successReportCommentApproveModalShow: boolean = false;

  showCommentReports: boolean = false;

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private authService: AuthService,
    private userService: UserService,
    private sectionService: SectionService,
  ) {}

  ngOnInit(): void {
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

  getUser(userId: number): IUser {
    const find = this.users.find((item) => item.id === userId);
    if (find) return find;
    return nullUser;
  }

  getComment(commentId: number, recipe: IRecipe): IComment {
    const find = recipe.comments.find((item) => item.id === commentId);
    if (find) return find;
    return nullComment;
  }
  getRecipe(recipeId: number): IRecipe {
    const find = this.recipes.find((item) => item.id === recipeId);
    if (find) return find;
    return nullRecipe;
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
      recipe.comments = recipe.comments.filter(
        (item) => item.id !== report.commentId,
      );
      recipe.reports = recipe.reports.filter(
        (item) => item.commentId !== report.commentId,
      );
      this.recipeService
        .updateRecipe(recipe)
        .subscribe(() => (this.successReportCommentApproveModalShow = true));
    }
    this.actionReport = null;
  }

  leaveComment() {
    const report = this.actionReport;

    if (report) {
      const recipe = this.getRecipe(report.recipeId);
      recipe.reports = recipe.reports.filter(
        (item) => item.commentId !== report.commentId,
      );
      this.recipeService
        .updateRecipe(recipe)
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
