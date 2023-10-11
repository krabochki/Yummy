import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecipesRoutingModule } from './recipes-routing.module';
import { RecipesComponent } from './recipes.component';
import { RecipePageComponent } from './components/recipes/recipe-page/recipe-page.component';
import { RecipeCreatingComponent } from './components/recipes/recipe-creating/recipe-creating.component';
import { MatchRecipesComponent } from './components/recipes/match-recipes/match-recipes.component';
import { CategoryCreatingComponent } from './components/categories/category-creating/category-creating.component';
import { SomeRecipesPageComponent } from './components/recipes/some-recipes-page/some-recipes-page.component';
import { CategoriesPageComponent } from './components/categories/categories-page/categories-page.component';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { RecipeListComponent } from './components/recipes/recipe-list/recipe-list.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { CategoryListComponent } from './components/categories/category-list/category-list.component';
import { CategoryListItemComponent } from './components/categories/category-list-item/category-list-item.component';
import { RecipeListItemComponent } from './components/recipes/recipe-list-item/recipe-list-item.component';
@NgModule({
  declarations: [
    RecipesComponent,
    RecipePageComponent,
    RecipeCreatingComponent,
    MatchRecipesComponent,
    CategoryCreatingComponent,
    SomeRecipesPageComponent,
    CategoriesPageComponent,
    RecipeListComponent
    , MainPageComponent,
    CategoryListComponent,
    CategoryListItemComponent,
    RecipeListItemComponent
    


  ],
  imports: [CommonModule, RecipesRoutingModule],
  providers: [AuthGuard],
  exports:[RecipeListComponent]
})
export class RecipesModule {}
