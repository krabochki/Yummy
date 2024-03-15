import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Observable, finalize, forkJoin, tap } from 'rxjs';
import { ReportService } from 'src/app/modules/recipes/services/report.service';
import { IReport } from './const';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import {
  IUser,
  nullUser,
} from 'src/app/modules/user-pages/models/users';
import { IRecipe, nullRecipe } from 'src/app/modules/recipes/models/recipes';
import { IComment, nullComment } from 'src/app/modules/recipes/models/comments';
import { CommentService } from 'src/app/modules/recipes/services/comment.service';
import { AuthService } from '../../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import {
  notifyForAuthorOfBlockedComment,
  notifyForAuthorOfLeavedComment,
  notifyForReporterOfBlockedComment,
  notifyForReporterOfLeavedComment,
} from '../notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';

@Component({
  animations: [trigger('modal', modal())],
  templateUrl: './control-reports.component.html',
  styleUrl: '../control-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlReportsComponent implements OnInit {
  reports: IReport[] = [];
  loaded = true;
  comments: IComment[] = [];
  users: IUser[] = [];
  recipes: IRecipe[] = [];
  step: number = 0;
  currentUser: IUser = { ...nullUser };

  confirmModal = false;
  action: 'dismiss' | 'approve' = 'dismiss';
  loadingModal = false;
  actionReport: IReport | null = null;
  actionModal = false;

  constructor(
    private recipeService: RecipeService,
    private userService: UserService,
    private reportService: ReportService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private commentService: CommentService,
    private titleService: Title,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Рассмотрение жалоб');
  }

  checkActualReports() {
    this.step = 0;
    this.loadMoreReports(true);
  }

  reportsPerStep: number = 3;
  everythingLoaded: boolean = false;

  loadMoreReports(checkUpdates?: boolean) {
    if (this.loaded) {
      this.loaded = false;

      this.cd.markForCheck();

      setTimeout(() => {
        this.reportService
          .getReports(this.reportsPerStep, this.step, this.currentUserId)
          .pipe(
            tap((res: any) => {
              const newReports: IReport[] = res.reports;
              const count = res.count;


                            if (checkUpdates) {
                              this.everythingLoaded = false;
                              this.reports = [];
                            }

              if (!newReports.length) {
                this.everythingLoaded = true;
                this.loaded = true;
                this.cd.markForCheck();

                return;
              }

              const actualReports = newReports.filter(
                (newUpdate) =>
                  !this.reports.some(
                    (existingReport) => existingReport.id === newUpdate.id,
                  ),
              );

              let reports$: Observable<any>[] = [];
              actualReports.forEach((report) => {
                const report$: Observable<any>[] = [];

                if (
                  !this.comments.find(
                    (comment) => comment.id === report.commentId,
                  )
                )
                  report$.push(
                    this.commentService.getComment(report.commentId).pipe(
                      tap((comment: IComment) => {
                        this.comments.push(comment);
                      }),
                    ),
                  );

                reports$ = [...reports$, ...report$];
              });

              if (!(reports$.length && reports$.length > 0)) {
                this.end(actualReports, count);
                return;
              }

              forkJoin(reports$)
                .pipe(
                  tap(() => {
                    actualReports.forEach((report) => {
                      const report$: Observable<any>[] = [];

                      if (
                        !this.recipes.find(
                          (recipe) => recipe.id === report.recipeId,
                        )
                      )
                        if (report.recipeId)
                          report$.push(
                            this.recipeService
                              .getMostShortedRecipe(report.recipeId)
                              .pipe(
                                tap((recipe) => {
                                  this.recipeService.addNewRecipe(recipe);
                                }),
                              ),
                          );
                      if (
                        !this.users.find(
                          (user) => user.id === report.reporterId,
                        )
                      )
                        report$.push(
                          this.recipeService
                            .getAuthorInfo(report.reporterId)
                            .pipe(
                              tap((user: IUser) => {
                                this.userService.addUserToUsers(user);
                              }),
                            ),
                        );

                      if (
                        !this.users.find(
                          (user) =>
                            user.id ===
                            this.getComment(report.commentId).authorId,
                        )
                      )
                        report$.push(
                          this.recipeService
                            .getAuthorInfo(
                              this.getComment(report.commentId).authorId,
                            )
                            .pipe(
                              tap((user: IUser) => {
                                this.userService.addUserToUsers(user);
                              }),
                            ),
                        );
                      reports$ = [...reports$, ...report$];
                    });

                    forkJoin(reports$)
                      .pipe(
                        tap(() => {
                          this.end(actualReports, count);
                          this.cd.markForCheck();
                        }),
                      )
                      .subscribe();
                  }),
                )
                .subscribe();
            }),
          )
          .subscribe();
      }, 2000);
    }
  }

  end(reports: IReport[], count: number) {
    if (reports.length > 0) {
      if (reports.length < 3) {
        this.everythingLoaded = true;
      }
      this.reports = [...this.reports, ...reports];
      this.step++;
    } else {
      this.everythingLoaded = true;
    }
    if (count <= this.reports.length) {
      this.everythingLoaded = true;
    }
    this.loaded = true;

    this.cd.markForCheck();
  }

  getName(user: IUser) {
    const name = user.fullName;
    const username = user.username;
    if (!name) return '@' + username;
    else return name;
  }

  getUser(userId: number) {
    return this.users.find((user) => user.id === userId) || nullUser;
  }

  getRecipe(recipeId: number) {
    return this.recipes.find((recipe) => recipe.id === recipeId) || nullRecipe;
  }

  getComment(commentId: number) {
    return (
      this.comments.find((comment) => comment.id === commentId) || nullComment
    );
  }

  recipesInit() {
    this.recipeService.recipes$.subscribe((receivedRecipes: IRecipe[]) => {
      this.recipes = receivedRecipes;
    });
  }
  usersInit() {
    this.userService.users$.subscribe((receivedUsers: IUser[]) => {
      this.users = receivedUsers;
    });
  }

  currentUserId = 0;

  currentUserInit() {
    this.authService.getTokenUser().subscribe(
      (user) =>
      {
        this.currentUserId = user.id;
        this.checkActualReports();

        
        }
    )
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
        this.currentUser = receivedUser;

    });
  }

  ngOnInit() {
    this.userService.usersSubject.next([]);
    this.recipeService.recipesSubject.next([]);
    this.recipesInit();
    this.usersInit();
    this.currentUserInit();
  }

  reportActionClick(action: 'dismiss' | 'approve', report: IReport): void {
    this.action = action;
    this.actionReport = report;
    this.confirmModal = true;
  }
  

  private sendNotifiesAfterDismissingReport(): void {
    if (this.actionReport && this.actionReport.commentId) {
      const comment: IComment = this.getComment(this.actionReport.commentId);
      const author = this.getUser(this.actionReport?.reporterId);
      const reporter = this.getUser(comment.authorId);
      if (comment.recipeId) {
        const recipe = this.getRecipe(comment.recipeId);

        const notifyForReporter = notifyForReporterOfLeavedComment(
          author,
          recipe,
          comment,
          this.notifyService,
        );
        this.notifyService.sendNotification(
          notifyForReporter,
          reporter.id,
        ).subscribe();
        const notifyForAuthor = notifyForAuthorOfLeavedComment(
          comment,
          recipe,
          this.notifyService,
        );
        this.notifyService.sendNotification(
          notifyForAuthor,
          author.id,
          //'your-reports-reviewed-moderator',
        ).subscribe();
      }
    }
  }

  private sendNotifiesAfterApprovingReport(): void {
    if (this.actionReport && this.actionReport.commentId) {
      const comment: IComment = this.getComment(this.actionReport.commentId);
      const author = this.getUser(this.actionReport?.reporterId);
      const reporter = this.getUser(comment.authorId);

      if (comment.recipeId) {
        const recipe = this.getRecipe(comment.recipeId);
        const notifyForAuthor = notifyForAuthorOfBlockedComment(
          comment,
          recipe,
          this.notifyService,
        );
        const notifyForReporter = notifyForReporterOfBlockedComment(
          comment,
          recipe,
          this.getUser(this.actionReport.reporterId),
          this.notifyService,
        );
        this.notifyService.sendNotification(
          notifyForReporter,
          reporter.id,
          //'your-reports-publish',
        ).subscribe(),
          this.notifyService.sendNotification(
            notifyForAuthor,
            author.id,
            //'your-reports-reviewed-moderator',
          ).subscribe();
      }
    }
  }


  approveReport() {
    if (this.actionReport) {
      const commentId = this.actionReport.commentId;
      this.commentService
        .deleteComment(commentId)
        .pipe(
          finalize(() => {
            this.loadingModal = false;
            this.cd.markForCheck();
          }),
          tap(() => {
            this.actionModal = true;
          }),
        )
        .subscribe();
    }
  }

  dismissReport() {
    if (this.actionReport?.id) {
      const reportId = this.actionReport.id;
      this.reportService
        .deleteReport(reportId)
        .pipe(
          finalize(() => {
            this.loadingModal = false;
            this.cd.markForCheck();
          }),
          tap(() => {
            this.actionModal = true;
          }),
        )
        .subscribe();
    }
  }

  handleActionModal() {
    this.actionModal = false;
    if (this.action === 'approve') {
      this.sendNotifiesAfterApprovingReport();
    } else {
      this.sendNotifiesAfterDismissingReport();
    }
  }

  handleConfirmModal(answer: boolean) {
    this.confirmModal = false;

    if (answer) {
      this.loadingModal = true;
      if (this.action === 'approve') {
        this.approveReport();
      } else {
        this.dismissReport();
      }
    }
    this.cd.markForCheck();
  }
}
