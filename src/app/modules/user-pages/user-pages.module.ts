import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserPagesRoutingModule } from './user-pages-routing.module';
import { UserPagesComponent } from './user-pages.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { EditAccountComponent } from './components/edit-account/edit-account.component';
import { NotifyComponent } from './components/notifications/notify/notify.component';
import { NotificationsListComponent } from './components/notifications/notifications-list/notifications-list.component';
import { FollowersAndFollowingComponent } from './components/followers-and-following/followers-and-following.component';
import { CommentComponent } from './components/comments/comment/comment.component';
import { CommentsListComponent } from './components/comments/comments-list/comments-list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ControlsModule } from '../controls/controls.module';
import { UsersPageComponent } from './components/users-page/users-page.component';
import { UsersListComponent } from './components/users-list/users-list.component';
import { UsersListItemComponent } from './components/users-list-item/users-list-item.component';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { RecipesModule } from '../recipes/recipes.module';
import { AngularSvgIconModule, SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { FormsModule } from '@angular/forms';
import { RouteEventsService } from '../controls/route-events.service';
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
    UsersPageComponent,
    UsersListComponent,
    UsersListItemComponent,
  ],
  imports: [
    CommonModule,
    UserPagesRoutingModule,
    ControlsModule,
    RecipesModule,
    SvgIconComponent,
    FormsModule,
  ],

  providers: [AuthGuard, provideAngularSvgIcon(), RouteEventsService],
})
export class UserPagesModule {
}
