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
      },
      {
        path: 'recipes/edit',
        component: RecipeCreatingComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes',
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/yours',
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes/favorite',
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
        component: SomeRecipesPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'recipes/search-results',
        component: SomeRecipesPageComponent,
      },
      {
        path: 'recipes/best',
        component: SomeRecipesPageComponent,
      },

      {
        path: 'recipes/recent',
        component: SomeRecipesPageComponent,
      },

      {
        path: 'categories/:id',
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
