import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RecipeListComponent } from './components/recipe-components/recipe-list/recipe-list.component';
import { RecipeListItemComponent } from './components/recipe-components/recipe-list-item/recipe-list-item.component';
import { HeaderComponent } from './components/header/header.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { HttpClientModule } from '@angular/common/http';
import { CategoryListItemComponent } from './components/category-components/category-list-item/category-list-item.component';
import { CategoryListComponent } from './components/category-components/category-list/category-list.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ModeratorGuard } from './guards/moderator.guard';
import {MatSelectModule} from '@angular/material/select';
import { SelectComponent } from './components/UI/select/select.component';
import { ControlDashboardComponent } from './components/control-dashboard/control-dashboard.component';
@NgModule({
  declarations: [
    AppComponent,
    RecipeListComponent,
    RecipeListItemComponent,
    HeaderComponent,
    MainPageComponent,
    CategoryListItemComponent,
    CategoryListComponent,
    SelectComponent,
    ControlDashboardComponent
  ],
  imports: [
    MatSlideToggleModule,
    MatSelectModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [AuthGuard, AdminGuard, ModeratorGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
