import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication.component';
import { EmailConfirmationComponent } from './components/email-confirmation/email-confirmation.component';
import { LoginComponent } from './components/login/login.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';
import { RegisterComponent } from './components/register/register.component';
import { GreetingsComponent } from './components/greetings/greetings.component';

const routes: Routes = [{
   path: '', component: AuthenticationComponent,
   children: [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'password-recovery', component: PasswordRecoveryComponent },
    { path: 'greetings', component: GreetingsComponent },
    { path: 'email-confirmation ', component: EmailConfirmationComponent },
  ],
  
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule { }
