import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  Subject,
  takeUntil,
  tap,
  finalize,
  catchError,
  EMPTY,
  Observable,
  switchMap,
  Subscription,
} from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { modal } from 'src/tools/animations';
import { AuthService } from '../../../services/auth.service';
import {  notifyForAuthorOfIngredient } from '../notifications';
import { IngredientService } from 'src/app/modules/recipes/services/ingredient.service';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { getFormattedDate } from 'src/tools/common';

IngredientService;
@Component({
  templateUrl: './control-users.component.html',
  animations: [trigger('modal', modal())],
  styleUrl: '../control-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlUsersComponent implements OnInit, OnDestroy {
  title = 'Пользователи';

  expiredCount = 0;
  currentUser: IUser = { ...nullUser };

  everythingLoaded = false;
  loaded = false;
  currentStep = 0;

  users: IUser[] = [];

  actionUser: IUser | null = null;

  loadingModal = false;
  errorModal = false;
  successModal = false;
  error = '';

  usersPerStep = 10;
  protected destroyed$: Subject<void> = new Subject<void>();
  subscriptions = new Subscription();

  constructor(
    private titleService: Title,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private userService: UserService,
    private notifyService: NotificationService,
  ) {
    this.titleService.setTitle('Пользователи');
  }

  ngOnInit() {
    this.currentUserInitialize();

    this.checkActualUsers();
  }

  checkActualUsers() {
      this.users = [];
      this.everythingLoaded = false;
    this.currentStep = 0;
    this.loaded = false;
    this.cd.markForCheck();
      this.loadMoreUsers();
  }

  registrationDate(user:IUser) {
    if(user.token && user.lastRegAttemptDate){
      return this.getDate(user.lastRegAttemptDate);
    }
    if(!user.token && user.registrationDate){
      return this.getDate(user.registrationDate)
    }
    return ''
  }

  fullRegistrationDate(user:IUser) {
      if (user.token && user.lastRegAttemptDate) {
        return getFormattedDate(user.lastRegAttemptDate);
      }
      if (!user.token && user.registrationDate) {
        return getFormattedDate(user.registrationDate);
      }
      return '';
  }

  loadMoreUsers() {
    if (this.loaded || !this.users.length) {
      this.loaded = false;
        this.subscriptions.add(
          this.userService
            .getSomeUsers(this.currentStep, this.usersPerStep)
            .pipe(takeUntil(this.destroyed$))
            .subscribe((response: any) => {
              const newUsers: IUser[] = response.users;
              const count = response.count;

              this.expiredCount = response.expiredCount;
              const actualUsers = newUsers.filter(
                (newUpdate) =>
                  !this.users.some(
                    (existingUpdate) => existingUpdate.id === newUpdate.id,
                  ),
              );

              if (actualUsers.length) {
                if (actualUsers.length > 0) {
                  if (actualUsers.length < this.usersPerStep) {
                    this.everythingLoaded = true;
                  }
                  this.users = [...this.users, ...actualUsers];
                  this.currentStep++;
                } else {
                  this.everythingLoaded = true;
                }
                if (count <= this.users.length) {
                  this.everythingLoaded = true;
                }
                this.loaded = true;
                this.cd.markForCheck();
              } else {
                this.currentStep = 0;
                this.everythingLoaded = true;
                this.loaded = true;
                this.cd.markForCheck();
              }
            }),
        );

    }
  }


  deleteUsers() {
    this.loadingModal = true;
    this.authService.deleteExpiredUsers()
      .pipe(
        finalize(() => {
          this.loadingModal = false;
          this.cd.markForCheck();
        }),
        tap(() => {
          this.successModal = true;
        }),
        catchError((response) => {
          const errorText = response.error.message;
          this.error = errorText;
          this.errorModal = true;
          return EMPTY;
        })
      )
      .subscribe()
    
  }

  handleSuccessModal(){
    this.successModal = false;
    const notify = this.notifyService.buildNotification(
      'Пользователи удалены',
      'Пользователи с истекшим сроком подтверждения регистрации успешно удалены',
      'info',
      'manager',
      '',
    );
    this.notifyService.sendNotification(notify, this.currentUser.id, true).subscribe()
    this.checkActualUsers();
  }



  



  

  getDate(date: string) {
    return new Date(date);
  }

  currentUserInitialize() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        this.currentUser = receivedUser;
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }
}
