import { CommonModule, Location } from '@angular/common';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  SvgIconComponent,
  provideAngularSvgIcon
} from 'angular-svg-icon';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { ControlsModule } from '../controls/controls.module';
import { RouteEventsService } from '../controls/route-events.service';
import { RecipesModule } from '../recipes/recipes.module';
import { CommentComponent } from './components/comments/comment/comment.component';
import { CommentsListComponent } from './components/comments/comments-list/comments-list.component';
import { EditAccountComponent } from './components/edit-account/edit-account.component';
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

@NgModule({
  declarations: [
    UserPagesComponent,
    UserPageComponent,
    EditAccountComponent,
    NotifyComponent,
    NotificationsListComponent,
    FollowersAndFollowingComponent,
    CommentComponent,
    CommentsListComponent,
    SettingsComponent,
    UsersListComponent,
    UsersListItemComponent,
    UsersPageComponent
  ],
  imports: [
    CommonModule,
    UserPagesRoutingModule,
    ControlsModule,
    RecipesModule,
    SvgIconComponent,
    FormsModule,
    ReactiveFormsModule
  ],

  providers: [
    { provide: LOCALE_ID, useValue: 'ru' },

    Location,
    AuthGuard,
    provideAngularSvgIcon(),
    RouteEventsService,
  ],
})
export class UserPagesModule {}
