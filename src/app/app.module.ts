import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { AdminGuard } from './modules/authentication/guards/admin.guard';
import { ModeratorGuard } from './modules/authentication/guards/moderator.guard';
import { ControlsModule } from './modules/controls/controls.module';
import { FooterComponent } from './components/footer/footer.component';
import { AngularSvgIconModule, SvgIconComponent } from 'angular-svg-icon';
import { RouteEventsService } from './modules/controls/route-events.service';
import { SectionService } from './modules/recipes/services/section.service';
import { CategoryService } from './modules/recipes/services/category.service';
import { RecipeService } from './modules/recipes/services/recipe.service';
import { UserService } from './modules/user-pages/services/user.service';
import { RecipesModule } from './modules/recipes/recipes.module';
import { UserPagesModule } from './modules/user-pages/user-pages.module';
import { PlanService } from './modules/planning/services/plan-service';
import { AuthService } from './modules/authentication/services/auth.service';

export function initializeSections(sectionSerivce: SectionService) {
  return () => sectionSerivce.loadSectionData();
}
export function initializeCategories(CategoryService: CategoryService) {
  return () => CategoryService.loadCategoryData();
}
export function initializeRecipes(RecipeService: RecipeService) {
  return () => RecipeService.loadRecipeData();
}
export function initializeUsers(UserService: UserService) {
  return () => UserService.loadUsersData();
}
export function initializeCurrentUser(authService: AuthService) {
  return () => authService.loadCurrentUserData();
}
export function initializePlans(planService: PlanService) {
  return () => planService.loadPlanData();
}
@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RecipesModule,
    ControlsModule,
    UserPagesModule,
    AngularSvgIconModule.forRoot(),
  ],
  providers: [
    UserService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUsers,
      deps: [UserService],
      multi: true,
    },
    AuthService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCurrentUser,
      deps: [AuthService],
      multi: true,
    },
    SectionService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSections,
      deps: [SectionService],
      multi: true,
    },
    CategoryService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCategories,
      deps: [CategoryService],
      multi: true,
    },

    RecipeService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRecipes,
      deps: [RecipeService],
      multi: true,
    },
    PlanService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializePlans,
      deps: [PlanService],
      multi: true,
    },
    AdminGuard,
    ModeratorGuard,
    RouteEventsService,
  ],
  bootstrap: [AppComponent],
  exports: [SvgIconComponent],
})
export class AppModule {}
