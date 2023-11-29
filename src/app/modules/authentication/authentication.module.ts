import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationRoutingModule } from './authentication-routing.module';
import { AuthenticationComponent } from './authentication.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';
import { GreetingsComponent } from './components/greetings/greetings.component';
import { ControlDashboardComponent } from './components/control-dashboard/control-dashboard.component';
import { ControlsModule } from '../controls/controls.module';
import { AuthGuard } from './guards/auth.guard';
import { OnlyNoAuthGuard } from './guards/only-no-auth.guard';
import { ModeratorGuard } from './guards/moderator.guard';
import { AdminGuard } from './guards/admin.guard';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { RecipesModule } from '../recipes/recipes.module';
import { ReactiveFormsModule } from '@angular/forms';
import { TimePastPipe } from 'ng-time-past-pipe';
import { UserPagesModule } from '../user-pages/user-pages.module';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
@NgModule({
  declarations: [

    AuthenticationComponent,
    LoginComponent,
    RegisterComponent,
    PasswordRecoveryComponent,
    GreetingsComponent,
    ControlDashboardComponent,
    PasswordResetComponent,
    WelcomeComponent,
    

  ],
  imports: [
    CommonModule,
    AuthenticationRoutingModule,
    ControlsModule,
    SvgIconComponent,
    TimePastPipe,
    ReactiveFormsModule,
    RecipesModule,
    UserPagesModule
  ],
  providers: [  provideAngularSvgIcon(),AuthGuard, AdminGuard, ModeratorGuard, OnlyNoAuthGuard]

})
export class AuthenticationModule { }
