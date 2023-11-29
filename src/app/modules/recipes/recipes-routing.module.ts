import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecipesComponent } from './recipes.component';
import { RecipePageComponent } from './components/recipes/recipe-page/recipe-page.component';
import { CategoriesPageComponent } from './components/categories/categories-page/categories-page.component';
import { MatchRecipesComponent } from './components/recipes/match-recipes/match-recipes.component';
import { SomeRecipesPageComponent } from './components/recipes/some-recipes-page/some-recipes-page.component';
import { CategoryCreatingComponent } from './components/categories/category-creating/category-creating.component';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { RecipeResolver } from './services/recipe.resolver';
import { RecipeAccessGuard } from './guards/recipe-access.guard';
import { CategoryResolver } from './services/category.resolver';
import { SectionResolver } from './services/section.resolver';
import { IngredientsPageComponent } from './components/ingredients/ingredients-page/ingredients-page.component';
import { IngredientPageComponent } from './components/ingredients/ingredient-page/ingredient-page.component';
import { IngredientGroupResolver } from './services/ingredient-group.resolver';
import { IngredientResolver } from './services/ingredient.resolver';
import { IngredientAccessGuard } from './guards/ingredient-access.guard';const routes: Routes = [
  {
    path: '',
    component: RecipesComponent,
    children: [
      {
        path: 'ingredients',
        component: IngredientsPageComponent,
        data: { filter: 'all-groups' },
      },
      {
        path: 'ingredients/list/:id',
        component: IngredientPageComponent,
        canActivate: [IngredientAccessGuard],
        resolve: { IngredientResolver },
      },
      {
        path: 'ingredients/groups/:id',
        component: IngredientsPageComponent,
        data: { filter: 'ingredient-group' },
        resolve: { IngredientGroupResolver },
      },
      {
        path: 'ingredients/popular',
        component: IngredientsPageComponent,
        data: { filter: 'popular' },
      },
      {
        path: 'recipes/list/:id',
        component: RecipePageComponent,
        resolve: { RecipeResolver },
        canActivate: [RecipeAccessGuard],
      },
      {
        path: 'recipes',
        data: { filter: 'all' },
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/commented',
        data: { filter: 'commented' },
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes/most-discussed',
        data: { filter: 'discussed' },
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/most-cooked',
        data: { filter: 'most-cooked' },
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/most-favorite',
        data: { filter: 'most-favorite' },
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/planned',
        data: { filter: 'planned' },
        canActivate: [AuthGuard],
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/matching',
        data: { filter: 'matching' },

        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/yours',
        data: { filter: 'my-recipes' },
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes/favorite',
        data: { filter: 'favorite' },
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'sections',

        data: { filter: 'sections' },
        component: CategoriesPageComponent,
      },
      {
        path: 'sections/list/:id',
        data: { filter: 'section' },
        resolve: { SectionResolver },
        component: CategoriesPageComponent,
      },
      {
        path: 'categories/add',
        component: CategoryCreatingComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes/updates',
        data: { filter: 'updates' },
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },

      {
        path: 'recipes/search-results',
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/best',
        data: { filter: 'popular' },
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/cooked',
        data: { filter: 'cooked' },
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },

      {
        path: 'recipes/liked',
        data: { filter: 'liked' },
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes/recent',
        data: { filter: 'recent' },
        component: SomeRecipesPageComponent,
      },

      {
        path: 'categories/list/:id',
        data: { filter: 'category-recipes' },
        resolve: { CategoryResolver },

        component: SomeRecipesPageComponent,
      },
    
      {
        path: 'ingredients/list/:id/recipes',
        data: { filter: 'ingredient-recipes' },
        canActivate: [IngredientAccessGuard],
        resolve: { IngredientResolver },
        component: SomeRecipesPageComponent,
      },
      {
        path: 'categories/popular',
        data: { filter: 'popular' },
        component: CategoriesPageComponent,
      },
      {
        path: 'categories',
        redirectTo: 'sections',
      },
      {
        path: 'match',
        component: MatchRecipesComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipesRoutingModule {}
