import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication.component';
import { EmailConfirmationComponent } from './components/email-confirmation/email-confirmation.component';
import { LoginComponent } from './components/login/login.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';
import { RegisterComponent } from './components/register/register.component';
import { GreetingsComponent } from './components/greetings/greetings.component';
import { OnlyNoAuthGuard } from './guards/only-no-auth.guard';

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
        path: 'greetings',
        component: GreetingsComponent,
        canActivate: [OnlyNoAuthGuard],
      },
      {
        path: 'email-confirmation ',
        component: EmailConfirmationComponent,
        canActivate: [OnlyNoAuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule { }
