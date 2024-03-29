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
import { SectionService } from './modules/recipes/services/section.service';
import { CategoryService } from './modules/recipes/services/category.service';
import { RecipeService } from './modules/recipes/services/recipe.service';
import { UserService } from './modules/user-pages/services/user.service';
import { RecipesModule } from './modules/recipes/recipes.module';
import { UserPagesModule } from './modules/user-pages/user-pages.module';
import { PlanService } from './modules/planning/services/plan-service';
import { AuthService } from './modules/authentication/services/auth.service';
import { IngredientService } from './modules/recipes/services/ingredient.service';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { UpdatesService } from './modules/common-pages/services/updates.service';
import { CommonPagesModule } from './modules/common-pages/common-pages.module';

export function initializeSections(sectionSerivce: SectionService) {
  return () => sectionSerivce.loadSectionData();
}
export function initializeUpdates(updateService: UpdatesService) {
  return () => updateService.loadUpdatesData();
}
export function initializeCategories(CategoryService: CategoryService) {
  return () => CategoryService.loadCategoriesFromSupabase();
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

export function initializeIngredients(ingredientService: IngredientService) {
  return () => ingredientService.loadIngredientsData();
}

export function initializeIngredientsGroupsData(
  ingredientService: IngredientService,
) {
  return () => ingredientService.loadIngredientsGroupsData();
}

@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RecipesModule,
    ControlsModule,
    BrowserModule,
    UserPagesModule,
    CommonPagesModule,
    AngularSvgIconModule.forRoot(),
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },

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
    IngredientService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeIngredients,
      deps: [IngredientService],
      multi: true,
    },
    IngredientService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeIngredientsGroupsData,
      deps: [IngredientService],
      multi: true,
    },
    UpdatesService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUpdates,
      deps: [UpdatesService],
      multi: true,
    },
    AdminGuard,
    ModeratorGuard,
  ],
  bootstrap: [AppComponent],
  exports: [SvgIconComponent],
})
export class AppModule {}
