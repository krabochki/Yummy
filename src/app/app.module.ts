import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RecipeListComponent } from './modules/recipes/components/recipes/recipe-list/recipe-list.component';
import { RecipeListItemComponent } from './modules/recipes/components/recipes/recipe-list-item/recipe-list-item.component';
import { HeaderComponent } from './components/header/header.component';
import { MainPageComponent } from './modules/recipes/components/main-page/main-page.component';
import { HttpClientModule } from '@angular/common/http';
import { CategoryListItemComponent } from './modules/recipes/components/categories/category-list-item/category-list-item.component';
import { CategoryListComponent } from './modules/recipes/components/categories/category-list/category-list.component';
import { AdminGuard } from './modules/authentication/guards/admin.guard';
import { ModeratorGuard } from './modules/authentication/guards/moderator.guard';
import { MatSelectModule } from '@angular/material/select';
import { ControlsModule } from './modules/controls/controls.module';
import { FooterComponent } from './components/footer/footer.component';

@NgModule({
  declarations: [
    AppComponent,
    RecipeListComponent,
    RecipeListItemComponent,
    HeaderComponent,
    MainPageComponent,
    CategoryListItemComponent,
    CategoryListComponent,
    FooterComponent,
  ],
  imports: [
    MatSlideToggleModule,
    MatSelectModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ControlsModule,
  ],
  providers: [AdminGuard, ModeratorGuard],
  bootstrap: [AppComponent],
})
export class AppModule {}
