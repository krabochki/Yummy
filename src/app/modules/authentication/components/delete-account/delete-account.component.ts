import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EMPTY, catchError, finalize, forkJoin, tap } from 'rxjs';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { nullUser } from 'src/app/modules/user-pages/models/users';

@Component({
  styleUrls: ['../../common-styles.scss'],
  templateUrl: './delete-account.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal())],
})
export class DeleteAccountComponent implements OnInit {
  title = 'Удаление аккаунта';

  successModalTitle = '';
  successModalDescription = '';
  successModal = false;
  deleteModal = false;
  loadingModal = false;
  cancelModal = false;

  userId: number = 0;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private router: Router,
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Удаление аккаунта');
    this.route.queryParams.subscribe((queryParam) => {
      const token = queryParam['token'];

      if (token) {
        this.authService
          .findUserByDeleteToken(token)
          .pipe(
            tap((deleteTokenUser) => {
              forkJoin([
                this.authService.removeDeleteTokenFromUser(deleteTokenUser.id),
                this.authService.autologinUser(deleteTokenUser),
              ]).subscribe(() => {
                this.authService
                  .getTokenUser()
                  .pipe(
                    tap((tokenUser) => {
                      this.authService
                        .getNotificationsByUser(tokenUser.id)
                        .subscribe((notifies) => {
                          tokenUser.notifications = notifies;
                          tokenUser.init = true;
                          this.authService.setCurrentUser(tokenUser);
                          this.userId = tokenUser.id;
                          this.cd.markForCheck();
                        });
                    }),
                  )
                  .subscribe();
              });
            }),
            catchError(() => {
              this.router.navigateByUrl('/');
              return EMPTY;
            }),
          )
          .subscribe();
      } else {
        this.router.navigateByUrl('/');
      }
    });
  }

  private deleteUser() {
    this.loadingModal = true;
    forkJoin([
      this.authService.deleteUserNotPublicRecipes(this.userId),
      this.authService.deleteUser(this.userId),
      this.authService.logout(),
    ])
      .pipe(
        tap(() => {
          this.authService.setCurrentUser({ ...nullUser });
          this.cd.markForCheck();
          this.successModalTitle = 'Успешное удаление';
          this.successModalDescription =
            'Вы успешно удалили свой аккаунт в социальной сети Yummy. Будем всегда рады видеть вас снова!';
          this.successModal = true;
        }),
        finalize(() => {
          this.loadingModal = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe();
  }

  private cancelUserDeletion() {
    this.successModalTitle = 'Успешная отмена';
    this.successModalDescription =
      'Вы успешно отменили удаление аккаунта в социальной сети Yummy. Спасибо, что остаетесь с нами!';
    this.successModal = true;
    this.cd.markForCheck();
  }

  handleSuccessModal() {
    this.router.navigateByUrl('/');
  }

  handleCancelModal(answer: boolean) {
    if (answer) {
      this.cancelUserDeletion();
    }
    this.cancelModal = false;
  }

  handleDeleteModal(answer: boolean) {
    if (answer) {
      this.deleteUser();
    }
    this.deleteModal = false;
  }
}
