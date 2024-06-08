import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPagesComponent } from './user-pages.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { UsersPageComponent } from './components/users-page/users-page.component';
import { UserResolver } from './services/user.resolver';
import { AuthGuard } from '../authentication/guards/auth.guard';
const routes: Routes = [
  {
    path: '',
    component: UserPagesComponent,

    children: [
      {
        path: 'cooks',
        data: { filter: 'all' },

        component: UsersPageComponent,
      },

      {
        path: 'cooks/popular',
        data: { filter: 'popular' },

        component: UsersPageComponent,
      },
      {
        path: 'cooks/managers',
        data: { filter: 'managers' },

        component: UsersPageComponent,
      },
   
      {
        path: 'cooks/following',
        data: { filter: 'following' },
        canActivate: [AuthGuard],

        component: UsersPageComponent,
      },
      {
        path: 'cooks/productive',
        data: { filter: 'productive' },

        component: UsersPageComponent,
      },
      {
        path: 'cooks/nearby',
        data: { filter: 'nearby' },
        canActivate: [AuthGuard],

        component: UsersPageComponent,
      },
      {
        path: 'cooks/most-viewed',
        data: { filter: 'most-viewed' },

        component: UsersPageComponent,
      },
      {
        path: 'cooks/new',
        data: { filter: 'new' },

        component: UsersPageComponent,
      },
      {
        path: 'cooks/list/:id',
        component: UserPageComponent,
        resolve: { user: UserResolver },
      }

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserPagesRoutingModule {}
