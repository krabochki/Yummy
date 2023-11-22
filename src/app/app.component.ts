import { Component, OnInit } from '@angular/core';
import { RecipeService } from './modules/recipes/services/recipe.service';
import { combineLatest, map } from 'rxjs';
import { supabase } from './modules/controls/image/supabase-data';
import { UserService } from './modules/user-pages/services/user.service';
import { CategoryService } from './modules/recipes/services/category.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  loaded = false;
  gif = 'preloader-light.gif';
  constructor(
    private recipeService: RecipeService,
    private userService: UserService,
    private categoryService: CategoryService,
  ) {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              userService.updateUsersAfterINSERT(payload.new);
              break;
            case 'UPDATE':
              userService.updateUsersAfterUPSERT(payload.new);
              break;
            case 'DELETE':
              userService.updateUsersAfterDELETE(payload.old);
              break;
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              categoryService.updateCategoriesAfterINSERT(payload.new);
              break;
            case 'UPDATE':
              categoryService.updateCategoriesAfterUPSERT(payload.new);
              break;
            case 'DELETE':
              categoryService.updateCategoriesAfterDELETE(payload.old);
              break;
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipes',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              recipeService.addNewRecipe(payload.new);
              break;
            case 'UPDATE':
              recipeService.uploadExistingRecipe(payload.new);
              break;
            case 'DELETE':
              recipeService.deleteExistingRecipe(payload.old);
              break;
          }
        },
      )
      .subscribe();
    this.combine();
  }

  combine() {
    combineLatest([
      this.recipesLoaded$,
      this.usersLoaded$,
      this.categoriesLoaded$,
    ]).subscribe(([recipesLoaded, usersLoaded, categoriesLoaded]) => {
      if (recipesLoaded && usersLoaded && categoriesLoaded) {
        this.loaded = true;
      }
    });
  }

  ngOnInit() {
    if (localStorage.getItem('theme') === 'dark') {
      this.gif = 'preloader-dark.gif';
      document.body.classList.add('dark-mode');
    } else {
      localStorage.setItem('theme', 'light');
    }
    this.recipeService.recipes$.subscribe();
    this.userService.users$.subscribe();
    this.categoryService.categories$.subscribe();
  }

  recipesLoaded$ = this.recipeService.recipes$.pipe(
    map((recipes) => recipes.length > 0),
  );
  categoriesLoaded$ = this.categoryService.categories$.pipe(
    map((categories) => categories.length > 0),
  );
  usersLoaded$ = this.userService.users$.pipe(map((users) => users.length > 0));
  spaceUnderHeaderHeight: number = 0;

  getHeaderHeight(headerHeight: number) {
    this.spaceUnderHeaderHeight = headerHeight;
  }
}
