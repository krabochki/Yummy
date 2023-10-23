import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RecipesRoutingModule } from './recipes-routing.module';
import { RecipesComponent } from './recipes.component';
import { RecipePageComponent } from './components/recipes/recipe-page/recipe-page.component';
import { RecipeCreatingComponent } from './components/recipes/recipe-creating/recipe-creating.component';
import { MatchRecipesComponent } from './components/recipes/match-recipes/match-recipes.component';
import { CategoryCreatingComponent } from './components/categories/category-creating/category-creating.component';
import { SomeRecipesPageComponent } from './components/recipes/some-recipes-page/some-recipes-page.component';
import { CategoriesPageComponent } from './components/categories/categories-page/categories-page.component';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { HorizontalRecipeListComponent } from './components/recipes/horizontal-recipe-list/horizontal-recipe-list.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { HorizontalCategoryListComponent } from './components/categories/horizontal-category-list/horizontal-category-list.component';
import { CategoryListItemComponent } from './components/categories/category-list-item/category-list-item.component';
import { RecipeListItemComponent } from './components/recipes/recipe-list-item/recipe-list-item.component';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { ControlsModule } from '../controls/controls.module';
import { CdkDropList, CdkDragHandle, CdkDrag } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { AsyncPipe } from '@angular/common';
   

import { VerticalRecipeListComponent } from './components/recipes/vertical-recipe-list/vertical-recipe-list.component';
import { VerticalCategoryListComponent } from './components/categories/vertical-category-list/vertical-category-list.component';


@NgModule({
  declarations: [
    RecipesComponent,
    RecipePageComponent,
    MatchRecipesComponent,
    CategoryCreatingComponent,
    SomeRecipesPageComponent,
    CategoriesPageComponent,
    MainPageComponent,
    CategoryListItemComponent,
    RecipeListItemComponent,
    RecipeCreatingComponent,
    HorizontalRecipeListComponent,
    VerticalRecipeListComponent,
    VerticalCategoryListComponent,
    HorizontalCategoryListComponent
  ],
  imports: [
    CommonModule,
    NgFor,
    ControlsModule,
    RecipesRoutingModule,
    SvgIconComponent,
    ControlsModule,
    ControlsModule,
    CommonModule,
    MatFormFieldModule,
    MatAutocompleteModule,MatInputModule,AsyncPipe,
    CdkDropList,
    CdkDragHandle,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    NgFor,
    CdkDrag,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    AuthGuard,
    provideAngularSvgIcon(),
    { provide: LOCALE_ID, useValue: 'ru' },
  ],
  exports: [HorizontalRecipeListComponent,VerticalCategoryListComponent, HorizontalCategoryListComponent, VerticalRecipeListComponent],
})
export class RecipesModule {}
