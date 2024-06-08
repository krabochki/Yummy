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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TimePastPipe } from 'ng-time-past-pipe';
import { UserPagesModule } from '../user-pages/user-pages.module';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { ControlUpdatesComponent } from './components/control-dashboard/updates/control-updates.component';
import { ControlCategoriesComponent } from './components/control-dashboard/categories/control-categories.component';
import { ControlRecipesComponent } from './components/control-dashboard/recipes/control-recipes.component';
import { ControlReportsComponent } from './components/control-dashboard/reports/control-reports.component';
import { ControlModeratorsComponent } from './components/control-dashboard/moderators/moderators.component';
import { ControlIngredientsComponent } from './components/control-dashboard/ingredients/control-ingredients.component';
import { ControlAchievementsComponent } from './components/control-dashboard/achievements/control-achievements/control-achievements.component';
import { NewAchievementComponent } from './components/control-dashboard/achievements/new-achievement/new-achievement.component';
@NgModule({
  declarations: [
    AuthenticationComponent,
    LoginComponent,
    RegisterComponent,
    PasswordRecoveryComponent,
    ControlCategoriesComponent,
    ControlAchievementsComponent,
    NewAchievementComponent,
    ControlUpdatesComponent,
    GreetingsComponent,
    ControlDashboardComponent,
    ControlRecipesComponent,
    PasswordResetComponent,
    ControlReportsComponent,
    ControlModeratorsComponent,
    ControlIngredientsComponent,
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
    FormsModule,
    
    UserPagesModule,
  ],
  providers: [
    provideAngularSvgIcon(),
    AuthGuard,
    AdminGuard,
    ModeratorGuard,
    OnlyNoAuthGuard,
  ],
})
export class AuthenticationModule {}
