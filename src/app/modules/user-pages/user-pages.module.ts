import { CommonModule, Location } from '@angular/common';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { AuthGuard } from '../authentication/guards/auth.guard';import { NgOptimizedImage } from '@angular/common';

import { ControlsModule } from '../controls/controls.module';
import { RouteEventsService } from '../controls/route-events.service';
import { RecipesModule } from '../recipes/recipes.module';
import { FollowersAndFollowingComponent } from './components/followers-and-following/followers-and-following.component';
import { NotificationsListComponent } from './components/notifications/notifications-list/notifications-list.component';
import { NotifyComponent } from './components/notifications/notify/notify.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { UsersListItemComponent } from './components/users-list-item/users-list-item.component';
import { UsersListComponent } from './components/users-list/users-list.component';
import { UsersPageComponent } from './components/users-page/users-page.component';
import { UserPagesRoutingModule } from './user-pages-routing.module';
import { UserPagesComponent } from './user-pages.component';
import { UserAccountEditComponent } from './components/user-account-edit/user-account-edit.component';
import { TimePastPipe } from 'ng-time-past-pipe';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';

@NgModule({
  declarations: [
    UserPagesComponent,
    UserPageComponent,
    NotifyComponent,
    NotificationsListComponent,
    FollowersAndFollowingComponent,
    SettingsComponent,
    UsersListComponent,
    UsersListItemComponent,
    UsersPageComponent,
    UserAccountEditComponent,
  ],
  imports: [
    CommonModule,
    UserPagesRoutingModule,
    ControlsModule,
    RecipesModule,
    TimePastPipe,
    NgOptimizedImage,
    PickerComponent,
    SvgIconComponent,
    EmojiComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru' },

    Location,
    AuthGuard,
    provideAngularSvgIcon(),
    RouteEventsService,
  ],
  exports: [NotificationsListComponent, UsersListComponent, NotifyComponent],
})
export class UserPagesModule {}
