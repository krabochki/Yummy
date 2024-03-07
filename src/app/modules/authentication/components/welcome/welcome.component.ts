import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EMPTY, Observable, catchError, forkJoin, tap } from 'rxjs';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  animations:[trigger('modal',modal())]
})
export class WelcomeComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private titleService: Title,
    private cd: ChangeDetectorRef,
    private router: Router,
  ) {
    this.titleService.setTitle('Добро пожаловать');
  }

  errorModal = false;
  errorText = '';
  ngOnInit() {
    this.route.queryParams.subscribe((queryParam) => {
      const token = queryParam['token'];

      if (token) {
        this.authService
          .findUserByConfirmToken(token)
          .pipe(
            tap((confirmTokenUser) => {
              forkJoin([
                this.authService.removeConfirmTokenFromUser(
                  confirmTokenUser.id,
                ),
                this.authService.autologinUser(confirmTokenUser),
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
                          this.cd.markForCheck();
                        });
                      
                    }),
                  )
                  .subscribe();
              });
            }),
            catchError((response) => {
              this.errorText = response.error || '';
              this.errorModal = true;
              this.cd.markForCheck();
              return EMPTY;
            }),
          )
          .subscribe();
      } else {
        this.router.navigateByUrl('/');
      }
    });
  }

  handleDeleteModal() {
    
    this.errorModal = false;

  this.router.navigateByUrl('/')}
}
