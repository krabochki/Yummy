import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { EMPTY, catchError, finalize, tap } from 'rxjs';
import { ReportService } from 'src/app/modules/recipes/services/report.service';
import { IReport } from './const';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
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
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';

@Component({
  animations: [trigger('modal', modal())],
  templateUrl: './control-reports.component.html',
  styleUrl: '../control-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlReportsComponent implements OnInit {
  reports: IReport[] = [];
  loaded = false;
  step: number = 0;
  currentUser: IUser = { ...nullUser };

  confirmModal = false;
  action: 'dismiss' | 'approve' = 'dismiss';
  loadingModal = false;
  actionReport: IReport | null = null;
  actionModal = false;

  constructor(
    private reportService: ReportService,
    private cd: ChangeDetectorRef,
    private userService: UserService,
    private authService: AuthService,
    private commentService: CommentService,
    private titleService: Title,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Рассмотрение жалоб');
  }

  checkActualReports() {
    this.reports = [];
    this.everythingLoaded = false;

    this.step = 0;
    this.loadMoreReports();
  }

  reportsPerStep: number = 3;
  everythingLoaded: boolean = false;

  loadMoreReports() {
    if (this.loaded || !this.reports.length) {
      this.loaded = false;

      this.cd.markForCheck();

      this.reportService
        .getReports(this.reportsPerStep, this.step)
        .pipe(
          tap((res: any) => {
            const newReports: IReport[] = res.reports;
            const count = res.count;

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
            this.end(actualReports, count);
          }),
        )
        .subscribe();
    }
  }

  end(reports: IReport[], count: number) {
    if (reports.length > 0) {
      if (reports.length < this.reportsPerStep) {
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

  currentUserInit() {
    this.checkActualReports();
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.currentUser = receivedUser;
    });
  }

  ngOnInit() {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1080) {
      this.reportsPerStep = 2;
      this.preloader = Array.from({ length: this.reportsPerStep }, (v, k) => k);
    }

    this.currentUserInit();
  }

  preloader = Array.from({ length: this.reportsPerStep }, (v, k) => k);

  reportActionClick(action: 'dismiss' | 'approve', report: IReport): void {
    this.action = action;
    this.actionReport = report;
    this.confirmModal = true;
  }

  private sendNotifiesAfterDismissingReport(): void {
    if (this.actionReport && this.actionReport.commentId) {
      const report = this.actionReport;

      this.userService
        .getLimitation(report.reporterId, Permission.YouReportedComment)
        .subscribe((limit) => {
          if (!limit) {
            const notifyForReporter = notifyForReporterOfLeavedComment(
              report.commentAuthorName,
              report.recipeName,
              report.recipeId || 0,
              report.commentText,
              this.notifyService,
            );
            this.notifyService
              .sendNotification(notifyForReporter, report.reporterId)
              .subscribe();
          }
        });

      this.userService
        .getLimitation(report.commentAuthorId, Permission.YourCommentReported)
        .subscribe((limit) => {
          if (!limit) {
            const notifyForAuthor = notifyForAuthorOfLeavedComment(
              report.commentText,
              report.recipeName,
              report.recipeId || 0,
              this.notifyService,
            );
            this.notifyService
              .sendNotification(notifyForAuthor, report.commentAuthorId)
              .subscribe();
          }
        });
    }
  }

  private sendNotifiesAfterApprovingReport(): void {
    if (this.actionReport && this.actionReport.commentId) {
      const report = this.actionReport;

      this.userService
        .getLimitation(report.reporterId, Permission.YouReportedComment)
        .subscribe((limit) => {
          if (!limit) {
            const notifyForReporter = notifyForReporterOfBlockedComment(
              report.commentText,
              report.recipeName,
              report.recipeId || 0,
              report.commentAuthorName,
              this.notifyService,
            );
            this.notifyService
              .sendNotification(notifyForReporter, report.reporterId)
              .subscribe();
          }
        });

      this.userService
        .getLimitation(report.commentAuthorId, Permission.YourCommentReported)
        .subscribe((limit) => {
          if (!limit) {
            const notifyForAuthor = notifyForAuthorOfBlockedComment(
              report.commentText,
              report.recipeName,
              report.recipeId || 0,
              this.notifyService,
            );

            this.notifyService
              .sendNotification(notifyForAuthor, report.commentAuthorId)
              .subscribe();
          }
        });
    }
  }

  approveReport() {
    if (this.actionReport && this.actionReport.id) {
      const commentId = this.actionReport.commentId;
      const reportId = this.actionReport.id;

      const deleteReport$ = this.reportService.deleteReport(reportId);
      const deleteComment$ = this.commentService.deleteComment(commentId).pipe(
        finalize(() => {
          this.loadingModal = false;
          this.cd.markForCheck();
        }),
        tap(() => {
          this.actionModal = true;
          this.checkActualReports();
        }),
      );

      deleteReport$
        .pipe(
          tap(() => {
            deleteComment$.subscribe();
          }),
          catchError((e: any) => {
            this.error = e.error.message;
            this.errorModal = true;
            this.loadingModal = false;
            this.checkActualReports();
            this.cd.markForCheck();
            return EMPTY;
          }),
        )
        .subscribe();
    }
  }
  errorModal = false;
  error = '';

  dismissReport() {
    if (this.actionReport?.id) {
      const reportId = this.actionReport.id;
      this.reportService
        .deleteReport(reportId)
        .pipe(
          catchError((e: any) => {
            this.error = e.error.message;
            this.errorModal = true;
            this.checkActualReports();
            return EMPTY;
          }),

          finalize(() => {
            this.loadingModal = false;
            this.cd.markForCheck();
          }),
          tap(() => {
            this.actionModal = true;
            this.checkActualReports();
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
