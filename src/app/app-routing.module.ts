import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from './modules/recipes/components/main-page/main-page.component';
import { PageNotFoundComponent } from './modules/controls/page-not-found/page-not-found.component';
import { AuthGuard } from './modules/authentication/guards/auth.guard';
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
  { path: '',  loadChildren: () => import('./modules/planning/planning.module').then(m => m.PlanningModule) },

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
