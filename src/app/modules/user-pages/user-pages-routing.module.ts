import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPagesComponent } from './user-pages.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { UsersPageComponent } from './components/users-page/users-page.component';
import { SomeRecipesPageComponent } from '../recipes/components/recipes/some-recipes-page/some-recipes-page.component';
import { UserResolver } from './services/user.resolver';
import { PageNotFoundComponent } from '../controls/page-not-found/page-not-found.component';
const routes: Routes = [
  {
    path: '',
    component: UserPagesComponent,

    children: [
      {
        path: 'cooks',
        component: UsersPageComponent,
      },
      {
        path: 'cooks/search',
        component: UsersPageComponent,
      },
      {
        path: 'cooks/list/:id',
        component: UserPageComponent,
        resolve: { user: UserResolver },
      },

      {
        path: 'cooks/updates',
        component: PageNotFoundComponent,
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
