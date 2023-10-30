import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPagesComponent } from './user-pages.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { UsersPageComponent } from './components/users-page/users-page.component';
import { SomeRecipesPageComponent } from '../recipes/components/recipes/some-recipes-page/some-recipes-page.component';
import { UserResolver } from './services/user.resolver';
import { PageNotFoundComponent } from '../controls/page-not-found/page-not-found.component';
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
        path: 'cooks/followers',
        data: { filter: 'followers' },
        canActivate: [AuthGuard],

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
        path: 'cooks/list/:id',
        component: UserPageComponent,
        resolve: { user: UserResolver },
      },

      {
        path: 'cooks/updates',
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
export class UserPagesRoutingModule {

 
 }
