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
import { ModeratorPageComponent } from './components/moderator-page/moderator-page.component';
@NgModule({
  declarations: [
    AppComponent,
    RecipeListComponent,
    RecipeListItemComponent,
    HeaderComponent,
    MainPageComponent,
    CategoryListItemComponent,
    CategoryListComponent,
    ModeratorPageComponent
  ],
  imports: [
    MatSlideToggleModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
