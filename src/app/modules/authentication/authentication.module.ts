import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationRoutingModule } from './authentication-routing.module';
import { AuthenticationComponent } from './authentication.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';
import { EmailConfirmationComponent } from './components/email-confirmation/email-confirmation.component';
import { GreetingsComponent } from './components/greetings/greetings.component';
import { ControlDashboardComponent } from './components/control-dashboard/control-dashboard.component';
import { ControlsModule } from '../controls/controls.module';
import { AuthGuard } from './guards/auth.guard';
import { OnlyNoAuthGuard } from './guards/only-no-auth.guard';
import { ModeratorGuard } from './guards/moderator.guard';
import { AdminGuard } from './guards/admin.guard';
@NgModule({
  declarations: [

    AuthenticationComponent,
    LoginComponent,
    RegisterComponent,
    PasswordRecoveryComponent,
    EmailConfirmationComponent,
    GreetingsComponent,
    ControlDashboardComponent,

  ],
  imports: [
    CommonModule,
    AuthenticationRoutingModule,
    ControlsModule,
  ],
  providers: [AuthGuard, AdminGuard, ModeratorGuard, OnlyNoAuthGuard]

})
export class AuthenticationModule { }
