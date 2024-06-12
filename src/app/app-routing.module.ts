import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from './modules/recipes/components/main-page/main-page.component';
import { PageNotFoundComponent } from './modules/common-pages/components/page-not-found/page-not-found.component';
import { AboutComponent } from './modules/common-pages/components/about/about.component';
import { UserPolicyComponent } from './modules/common-pages/components/user-policy/user-policy.component';
import { UpdatesComponent } from './modules/common-pages/components/updates/updates/updates.component';
import { RegBenefitsComponent } from './modules/common-pages/components/reg-benefits/reg-benefits.component';

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
    component: UserPolicyComponent,
  },
  {
    path: 'registration-benefits',
    component: RegBenefitsComponent,
  },
  {
    path: 'news',
    component: UpdatesComponent,
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
