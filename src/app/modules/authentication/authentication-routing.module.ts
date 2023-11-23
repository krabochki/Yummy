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
import { AuthGuard } from './guards/auth.guard';

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
        path: 'greetings',
        component: GreetingsComponent,
        canActivate: [OnlyNoAuthGuard],
      },

      {
        path: 'control-dashboard',
        component: ControlDashboardComponent,
        canActivate: [ModeratorGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule { }
