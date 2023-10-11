import { NgModule } from '@angular/core';
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
    SettingsComponent
  ],
  imports: [
    CommonModule,
    UserPagesRoutingModule
  ]
})
export class UserPagesModule { }
