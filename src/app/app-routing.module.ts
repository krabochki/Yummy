import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from './modules/recipes/components/main-page/main-page.component';
import { AuthGuard } from './modules/authentication/guards/auth.guard';
import { AdminGuard } from './modules/authentication/guards/admin.guard';
import { ModeratorGuard } from './modules/authentication/guards/moderator.guard';

import { ControlDashboardComponent } from './modules/authentication/components/control-dashboard/control-dashboard.component';
const routes: Routes = [
  { path: '', component: MainPageComponent },
  {
    path: 'admin-panel',
    canActivate: [AdminGuard],
    component: ControlDashboardComponent,
  },
  {
    path: 'moderator-panel',
    canActivate: [ModeratorGuard],
    component: ControlDashboardComponent,
  },
  {
    path: 'your-recipes',
    canActivate: [AuthGuard],
    component: MainPageComponent,
  },
  { path: 'favourite-recipes', component: MainPageComponent },
  { path: 'all-recipes', component: MainPageComponent },
  {
    path: 'authentication',
    loadChildren: () =>
      import('./modules/authentication/authentication.module').then(
        (m) => m.AuthenticationModule,
      ),
  },
  {
    path: 'user-pages',
    loadChildren: () =>
      import('./modules/user-pages/user-pages.module').then(
        (m) => m.UserPagesModule,
      ),
  },
  {
    path: 'recipes',
    loadChildren: () =>
      import('./modules/recipes/recipes.module').then((m) => m.RecipesModule),
  },
  { path: '**', component: MainPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
