import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RecipesRoutingModule } from './recipes-routing.module';
import { RecipesComponent } from './recipes.component';
import { RecipePageComponent } from './components/recipes/recipe-page/recipe-page.component';
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
import { AsyncPipe } from '@angular/common';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragScrollModule } from 'ngx-drag-scroll';

import { VerticalRecipeListComponent } from './components/recipes/vertical-recipe-list/vertical-recipe-list.component';
import { VerticalCategoryListComponent } from './components/categories/vertical-category-list/vertical-category-list.component';
import { RecipeCreateComponent } from './components/recipes/recipe-create/recipe-create.component';
import { CommentComponent } from './components/comments/comment/comment.component';
import { CommentsListComponent } from './components/comments/comments-list/comments-list.component';
import { CUSTOM_TIME_DIFF_GENERATOR, TimePastPipe } from 'ng-time-past-pipe';
import { timeDiffGenerator } from '../controls/time';
import { SectionCreatingComponent } from './components/categories/section-creating/section-creating.component';
import { PlanningModule } from '../planning/planning.module';
import { IngredientPageComponent } from './components/ingredients/ingredient-page/ingredient-page.component';
import { IngredientsPageComponent } from './components/ingredients/ingredients-page/ingredients-page.component';
import { IngredientsVerticalListComponent } from './components/ingredients/ingredients-vertical-list/ingredients-vertical-list.component';
import { IngredientsHorizontalListComponent } from './components/ingredients/ingredients-horizontal-list/ingredients-horizontal-list.component';
import { IngredientListItemComponent } from './components/ingredients/ingredient-list-item/ingredient-list-item.component';
import { IngredientCreateComponent } from './components/ingredients/ingredient-create/ingredient-create.component';
import { GroupCreatingComponent } from './components/ingredients/group-creating/group-creating.component';
import { CommonPagesModule } from '../common-pages/common-pages.module';
import { NgxImageCompressService } from 'ngx-image-compress';
import { SectionPageComponent } from './components/categories/section-page/section-page.component';
import { GroupsPageComponent } from './components/ingredients/groups-page/groups-page.component';
import { GroupPageComponent } from './components/ingredients/group-page/group-page.component';
import { SectionsPageComponent } from './components/categories/sections-page/sections-page.component';

@NgModule({
  declarations: [
    RecipesComponent,
    CommentComponent,
    CommentsListComponent,
    RecipePageComponent,
    SectionPageComponent,
    MatchRecipesComponent,
    CategoryCreatingComponent,
    SomeRecipesPageComponent,
    CategoriesPageComponent,
    MainPageComponent,
    CategoryListItemComponent,
    RecipeListItemComponent,
    RecipeCreateComponent,
    GroupsPageComponent,
    HorizontalRecipeListComponent,
    VerticalRecipeListComponent,
    GroupPageComponent,
    VerticalCategoryListComponent,
    HorizontalCategoryListComponent,
    SectionCreatingComponent,
    IngredientPageComponent,
    IngredientsPageComponent,
    IngredientsVerticalListComponent,
    IngredientsHorizontalListComponent,
    IngredientListItemComponent,
    GroupCreatingComponent,
    SectionsPageComponent,

    IngredientCreateComponent,
  ],
  imports: [
    CommonModule,
    TimePastPipe,
    DragScrollModule,
    NgFor,
    PlanningModule,
    ControlsModule,
    RecipesRoutingModule,
    CommonPagesModule,
    ScrollingModule,
    SvgIconComponent,
    CommonModule,
    AsyncPipe,
    CdkDropList,
    CdkDragHandle,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    NgxImageCompressService,

    AuthGuard,
    { provide: CUSTOM_TIME_DIFF_GENERATOR, useValue: timeDiffGenerator },
    provideAngularSvgIcon(),
    { provide: LOCALE_ID, useValue: 'ru' },
  ],

  exports: [
    HorizontalRecipeListComponent,
    VerticalCategoryListComponent,
    HorizontalCategoryListComponent,
    GroupCreatingComponent,
    IngredientsVerticalListComponent,
    IngredientsHorizontalListComponent,
    VerticalRecipeListComponent,
    SectionCreatingComponent,
    RecipeCreateComponent,
  ],
})
export class RecipesModule {}
