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

@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RecipesModule,
    ControlsModule,
    AngularSvgIconModule.forRoot(),
  ],
  providers: [
      

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
    UserService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUsers,
      deps: [UserService],
      multi: true,
    },
    RecipeService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRecipes,
      deps: [RecipeService],
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
