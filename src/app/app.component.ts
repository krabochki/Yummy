import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { RecipeService } from './modules/recipes/services/recipe.service';
import { map } from 'rxjs';
import { supabase } from './modules/controls/image/supabase-data';
import { UserService } from './modules/user-pages/services/user.service';
import { CategoryService } from './modules/recipes/services/category.service';
import { SectionService } from './modules/recipes/services/section.service';
import { IngredientService } from './modules/recipes/services/ingredient.service';
import { PlanService } from './modules/planning/services/plan-service';
import { UpdatesService } from './modules/common-pages/services/updates.service';
import { AuthService } from './modules/authentication/services/auth.service';
import { IUser, nullUser } from './modules/user-pages/models/users';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  loaded = false;
  gif = 'preloader-light.gif';
  currentUser: IUser = nullUser;
  constructor(
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private authService: AuthService,
    private sectionsService: SectionService,
    private userService: UserService,
    private updateService: UpdatesService,
    private categoryService: CategoryService,
    private planService: PlanService,
  ) {
   
    supabase
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
          table: 'plans',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              planService.updatePlansAfterINSERT(payload.new);
              break;
            case 'UPDATE':
              planService.updatePlansAfterUPSERT(payload.new);
              break;
            case 'DELETE':
              planService.updatePlansAfterDELETE(payload.old);
              break;
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'updates',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              updateService.updateUpdatesAfterINSERT(payload.new);
              break;
            case 'UPDATE':
              updateService.updateUpdatesAfterUPSERT(payload.new);
              break;
            case 'DELETE':
              updateService.updateUpdatesAfterDELETE(payload.old);
              break;
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sections',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              sectionsService.updateCategoriesAfterINSERT(payload.new);
              break;
            case 'UPDATE':
              sectionsService.updateSectionsAfterUPSERT(payload.new);
              break;
            case 'DELETE':
              sectionsService.updateCategoriesAfterDELETE(payload.old);
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
            case 'UPDATE': {
              categoryService.updateCategoriesAfterUPSERT(payload.new);
              break;
            }
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
          table: 'ingredients',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              ingredientService.updateIngredientsAfterINSERT(payload.new);
              break;
            case 'UPDATE':
              ingredientService.updateIngredientsAfterUPSERT(payload.new);
              break;
            case 'DELETE':
              ingredientService.updateIngredientsAfterDELETE(payload.old);
              break;
          }
        },
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              ingredientService.updateGroupsAfterINSERT(payload.new);
              break;
            case 'UPDATE':
              ingredientService.updateGroupsAfterUPSERT(payload.new);
              break;
            case 'DELETE':
              ingredientService.updateGroupsAfterDELETE(payload.old);
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
  }

  checkIfLoaded() {
    if (
      ((this.recipeService.recipes$.pipe(map((recipes) => recipes.length > 0)),
      this.userService.users$.pipe(map((users) => users.length > 0)),
      this.sectionsService.sections$.pipe(
        map((sections) => sections.length > 0),
      ),
      this.updateService.updates$.pipe(map((updates) => updates.length > 0)),
      this.planService.plans$.pipe(map((plans) => plans.length > 0)),
      this.ingredientService.ingredients$.pipe(
        map((ingredients) => ingredients.length > 0),
      ),
      this.categoryService.categories$.pipe(
        map((categories) => categories.length > 0),
      )),
      this.ingredientService.ingredientsGroups$.pipe(
        map((groups) => groups.length > 0),
      ))
    )
      this.loaded = true;
  }


  async ngOnInit() {
    const favicon = document.querySelector('#favicon');
    
    if (localStorage.getItem('theme') === 'dark') {
      this.gif = 'preloader-dark.gif';
      document.body.classList.add('dark-mode');
      favicon?.setAttribute('href', '/assets/images/chef-day.png');
    } else {
      localStorage.setItem('theme', 'light');
      favicon?.setAttribute('href', '/assets/images/chef-night.png');
    }
    if (!this.loaded) {
      this.recipeService.loadRecipeData().then(() => {
        this.checkIfLoaded();
      });
    }
    if (!this.loaded) {
      this.updateService.loadUpdatesData().then(() => {
        this.checkIfLoaded();
      });
    }
    if (!this.loaded) {
      this.userService.loadUsersData().then(() => {
        this.checkIfLoaded();
      });
    }
    if (!this.loaded) {
      this.ingredientService.loadIngredientsGroupsData().then(() => {
        this.checkIfLoaded();
      });
    }
    if (!this.loaded) {
      this.ingredientService.loadIngredientsData().then(() => {
        this.checkIfLoaded();
      });
    }
    if (!this.loaded) {
      this.categoryService.loadCategoriesFromSupabase().then(() => {
        this.checkIfLoaded();
      });
    }
    if (!this.loaded) {
      this.sectionsService.loadSectionsFromSupabase().then(() => {
        this.checkIfLoaded();
      });
    }
    if (!this.loaded) {
      this.planService.loadPlanData().then(() => {
        this.checkIfLoaded();
      });
    }
  }

  spaceUnderHeaderHeight: number = 0;

  getHeaderHeight(headerHeight: number) {
    this.spaceUnderHeaderHeight = headerHeight;
  }

  @HostListener('window:beforeunload', ['$event'])
  async beforeUnloadHandler(event: any) {
    if(this.currentUser.id>0)
    await this.authService.setOffline(this.currentUser);
    
  }
}
