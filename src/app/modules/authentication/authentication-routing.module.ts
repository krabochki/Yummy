import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication.component';
import { LoginComponent } from './components/login/login.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';
import { RegisterComponent } from './components/register/register.component';
import { GreetingsComponent } from './components/greetings/greetings.component';
import { OnlyNoAuthGuard } from './guards/only-no-auth.guard';
import { ControlDashboardComponent } from './components/control-dashboard/control-dashboard.component';
import { ModeratorGuard } from './guards/moderator.guard';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { ControlUpdatesComponent } from './components/control-dashboard/updates/control-updates.component';
import { AdminGuard } from './guards/admin.guard';
import { ControlCategoriesComponent } from './components/control-dashboard/categories/control-categories.component';
import { ControlRecipesComponent } from './components/control-dashboard/recipes/control-recipes.component';
import { ControlReportsComponent } from './components/control-dashboard/reports/control-reports.component';
import { ControlModeratorsComponent } from './components/control-dashboard/moderators/moderators.component';
import { ControlIngredientsComponent } from './components/control-dashboard/ingredients/control-ingredients.component';
import { ControlAchievementsComponent } from './components/control-dashboard/achievements/control-achievements/control-achievements.component';
import { ControlUsersComponent } from './components/control-dashboard/users/control-users.component';
const routes: Routes = [
  {
    path: '',
    component: AuthenticationComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [OnlyNoAuthGuard],
      },
      {
        path: 'register',
        component: RegisterComponent,
        canActivate: [OnlyNoAuthGuard],
      },
      {
        path: 'password-recovery',
        component: PasswordRecoveryComponent,
        canActivate: [OnlyNoAuthGuard],
      },
      {
        path: 'welcome',
        component: WelcomeComponent,
      },

      {
        path: 'password-reset',
        component: PasswordResetComponent,
      },

    
      {
        path: 'control-dashboard/achievements',
        component: ControlAchievementsComponent,
        canActivate: [AdminGuard],
      },

       {
        path: 'control-dashboard/users',
        component: ControlUsersComponent,
        canActivate: [AdminGuard],
      },

      {
        path: 'greetings',
        component: GreetingsComponent,
        canActivate: [OnlyNoAuthGuard],
      },

      {
        path: 'control-dashboard',
        component: ControlDashboardComponent,
        canActivate: [ModeratorGuard],
      },

      {
        path: 'control-dashboard/updates',
        component: ControlUpdatesComponent,
        canActivate: [AdminGuard],
      },

      {
        path: 'control-dashboard/recipes',
        component: ControlRecipesComponent,
        canActivate: [ModeratorGuard],
      },
      {
        path: 'control-dashboard/reports',
        component: ControlReportsComponent,
        canActivate: [ModeratorGuard],
      },
      {
        path: 'control-dashboard/categories',
        component: ControlCategoriesComponent,
        canActivate: [ModeratorGuard],
      },
      {
        path: 'control-dashboard/moderators',
        component: ControlModeratorsComponent,
        canActivate: [AdminGuard],
      },

      {
        path: 'control-dashboard/ingredients',
        component: ControlIngredientsComponent,
        canActivate: [ModeratorGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthenticationRoutingModule {}
