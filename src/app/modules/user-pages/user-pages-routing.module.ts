import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPagesComponent } from './user-pages.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { UsersPageComponent } from './components/users-page/users-page.component';
import { SomeRecipesPageComponent } from '../recipes/components/recipes/some-recipes-page/some-recipes-page.component';
import { UserResolver } from './services/user.resolver';
import { AuthGuard } from '../authentication/guards/auth.guard';
const routes: Routes = [
  {
    path: '',
    component: UserPagesComponent,

    children: [
      {
        pathMatch: 'prefix',

        path: 'cooks',
        data: { filter: 'all' },

        component: UsersPageComponent,
      },

      {
        pathMatch: 'full',
        path: 'cooks/popular',
        data: { filter: 'popular' },

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/managers',
        data: { filter: 'managers' },

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/followers',
        data: { filter: 'followers' },
        canActivate: [AuthGuard],

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/following',
        data: { filter: 'following' },
        canActivate: [AuthGuard],

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/productive',
        data: { filter: 'productive' },

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/nearby',
        data: { filter: 'nearby' },
        canActivate: [AuthGuard],

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/most-viewed',
        data: { filter: 'most-viewed' },

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/new',
        data: { filter: 'new' },

        component: UsersPageComponent,
      },
      {
        pathMatch: 'full',
        path: 'cooks/list/:id',
        component: UserPageComponent,
        resolve: { user: UserResolver },
      },

      {  pathMatch : 'full',
        path: 'cooks/updates',
        canActivate: [AuthGuard],
        data: { filter: 'updates' },
        component: SomeRecipesPageComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserPagesRoutingModule {}
