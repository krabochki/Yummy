import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecipesComponent } from './recipes.component';
import { RecipePageComponent } from './components/recipes/recipe-page/recipe-page.component';
import { CategoriesPageComponent } from './components/categories/categories-page/categories-page.component';
import { MatchRecipesComponent } from './components/recipes/match-recipes/match-recipes.component';
import { SomeRecipesPageComponent } from './components/recipes/some-recipes-page/some-recipes-page.component';
import { RecipeCreatingComponent } from './components/recipes/recipe-creating/recipe-creating.component';
import { CategoryCreatingComponent } from './components/categories/category-creating/category-creating.component';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { RecipeResolver } from './services/recipe.resolver';
import { RecipeAccessGuard } from './guards/recipe-access.guard';
import { RecipeCreateClosingGuard } from './guards/recipe-create-closing.guard';
const routes: Routes = [
  {
    path: '',
    component: RecipesComponent,
    children: [
      {
        path: 'recipes/list/:id',
        component: RecipePageComponent,
        resolve: { RecipeResolver },
        canActivate: [RecipeAccessGuard],
      },
      {
        path: 'recipes/add',
        component: RecipeCreatingComponent,
        canActivate: [AuthGuard],
        canDeactivate: [RecipeCreateClosingGuard],
      },
      {
        path: 'recipes/edit',
        component: RecipeCreatingComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes',
        data: { filter: 'all' },
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
        path: 'categories',
        component: CategoriesPageComponent,
      },
      {
        path: 'categories/add',
        component: CategoryCreatingComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes/following',
        data: { filter: 'following' },
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
        path: 'recipes/recent',
        data: { filter: 'recent' },
        component: SomeRecipesPageComponent,
      },

      {
        path: 'categories/list/:id',
        data: { filter: 'category-recipes' },

        component: SomeRecipesPageComponent,
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
  exports: [RouterModule]
})
export class RecipesRoutingModule { }
