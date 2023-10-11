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
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
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
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class AuthenticationModule { }
