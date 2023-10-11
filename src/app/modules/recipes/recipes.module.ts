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


@NgModule({
  declarations: [
    RecipesComponent,
    RecipePageComponent,
    RecipeCreatingComponent,
    MatchRecipesComponent,
    CategoryCreatingComponent,
    SomeRecipesPageComponent,
    CategoriesPageComponent
  ],
  imports: [
    CommonModule,
    RecipesRoutingModule
  ]
})
export class RecipesModule { }
