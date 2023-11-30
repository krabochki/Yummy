import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from './modules/recipes/components/main-page/main-page.component';
import { PageNotFoundComponent } from './modules/controls/page-not-found/page-not-found.component';
import { AnonimPageComponent } from './modules/controls/anonim/anonim.component';
import { AboutComponent } from './modules/controls/about/about.component';
import { UserPolicyComponent } from './modules/controls/user-policy/user-policy.component';

const routes: Routes = [
  { path: '', component: MainPageComponent },
  {
    path: '',
    loadChildren: () =>
      import('./modules/authentication/authentication.module').then(
        (m) => m.AuthenticationModule,
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/recipes/recipes.module').then((m) => m.RecipesModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/user-pages/user-pages.module').then(
        (m) => m.UserPagesModule,
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/planning/planning.module').then(
        (m) => m.PlanningModule,
      ),
  },
  {
    path: 'about',
    component: AboutComponent,
  },
   {
     path: 'user-policy',
     component: UserPolicyComponent
    
   },
  {
    path: 'access-denied',
    component: AnonimPageComponent,
  },

  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
