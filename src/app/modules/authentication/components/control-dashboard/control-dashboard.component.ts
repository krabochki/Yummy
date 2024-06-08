/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { RecipeService } from 'src/app/modules/recipes/services/recipe.service';
import {
  IUser,
  
  nullUser,
} from 'src/app/modules/user-pages/models/users';
import { ChangeDetectionStrategy } from '@angular/core';
import {
  Observable,
  Subject,
  forkJoin,
  takeUntil,
  tap,
} from 'rxjs';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { CategoryService } from 'src/app/modules/recipes/services/category.service';
import { IngredientService } from 'src/app/modules/recipes/services/ingredient.service';

import { UpdatesService } from 'src/app/modules/common-pages/services/updates.service';
import { actions } from './consts';
import { ReportService } from 'src/app/modules/recipes/services/report.service';
import { AchievementService } from './achievements/services/achievement.service';
import { formatNumber } from 'src/tools/common';

@Component({
  selector: 'app-control-dashboard',
  templateUrl: './control-dashboard.component.html',
  styleUrls: ['./control-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class ControlDashboardComponent implements OnInit, OnDestroy {
  protected currentUser: IUser = { ...nullUser };

  updatesLength: number = -1;
  categoriesLength: number = -1;
  ingredientsLength: number = -1;
  recipesLength: number = -1;
  modetatorsLength: number = -1;
  achievementsLength: number = -1;


  recipeArVariants = ['рецепт', 'рецепта', 'рецептов'];
  updateArVariants = ['новость', 'новости', 'новостей'];
  reportsArVariants = ['жалоба', 'жалобы', 'жалоб'];
  moderatorsArVariants = ['модератор', 'модератора', 'модераторов'];
  categoriesArVariants = ['категория', 'категории', 'категорий'];
  ingredientsArVariants = ['ингредиент', 'ингредиента', 'ингредиентов'];

  actions = actions;

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private cd: ChangeDetectorRef,
    private reportService: ReportService,
    private updateService: UpdatesService,
    private titleService: Title,
    private ingredientService: IngredientService,
    private achievementService:AchievementService,
    private authService: AuthService,
    private categoryService: CategoryService,
  ) {}

  public ngOnInit(): void {
    this.currentUserInit();
    this.authService.setDashboardOpened(true);
    this.titleService.setTitle('Панель управления');
  }


  formatNumber(number:number){
    return formatNumber(number);
  }

  private initAllData(): void {
    const count$: Observable<any>[] = [];
    count$.push(this.getAwaitingCategoriesCount());
    count$.push(this.getAwaitingRecipesCount());
    count$.push(this.getAwaitingIngredientsCount());
    count$.push(this.getReportsCount());
    if (this.currentUser.role === 'admin') {
      count$.push(this.getAwaitingUpdatesCount());
      count$.push(this.getAchievementsCount());
      count$.push(this.getModeratorsCount());
    }
    forkJoin(count$).subscribe();
  }

  getReportsCount() {
    return this.reportService.getReportsCount().pipe(
      tap((res: any) => {
        this.reportsLength = res[0].count;
        this.cd.markForCheck();
      }),
    );
  }

  getAchievementsCount() {
    return this.achievementService.getAchievementsCount().pipe(
      tap((res: any) => {
        this.achievementsLength = res[0].count;
        this.cd.markForCheck();
      }),
    );
  }
  reportsLength: number = -1;

  getModeratorsCount() {
    return this.authService.getModeratorsCount().pipe(
      tap((res: any) => {
        this.modetatorsLength = res[0].count;
        this.cd.markForCheck();
      }),
    );
  }

  getAwaitingUpdatesCount() {
    return this.updateService.getAwaitingUpdatesCount().pipe(
      tap((res: any) => {
        this.updatesLength = res[0].count;
        this.cd.markForCheck();
      }),
    );
  }

  getAwaitingCategoriesCount() {
    return this.categoryService.getAwaitingCategoriesCount().pipe(
      tap((res: any) => {
        this.categoriesLength = res[0].count;
        this.cd.markForCheck();
      }),
    );
  }

  getAwaitingIngredientsCount() {
    return this.ingredientService.getAwaitingIngredientsCount().pipe(
      tap((res: any) => {
        this.ingredientsLength = res[0].count;
        this.cd.markForCheck();
      }),
    );
  }

  getAwaitingRecipesCount() {
    return this.recipeService.getAwaitingRecipesCount().pipe(
      tap((res: any) => {
        this.recipesLength = res[0].count;
        this.cd.markForCheck();
      }),
    );
  }

  private currentUserInit(): void {
    this.authService.getTokenUser().subscribe((user) => {
      this.currentUser = user;
      this.initAllData();
      this.cd.markForCheck();
    });
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        {
          this.currentUser = receivedUser;
          this.cd.markForCheck();
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
