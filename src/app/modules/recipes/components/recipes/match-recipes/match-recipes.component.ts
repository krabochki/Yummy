/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { IRecipe } from '../../../models/recipes';
import { SectionService } from '../../../services/section.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { SectionGroup } from 'src/app/modules/controls/autocomplete/autocomplete.component';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { dragEnd, dragStart } from 'src/tools/common';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { getZoom } from 'src/tools/common';
import { IngredientService } from '../../../services/ingredient.service';
import { IIngredient } from '../../../models/ingredients';
import { MatchService } from './match.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-match-recipes',
  templateUrl: './match-recipes.component.html',
  styleUrls: ['./match-recipes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
})
export class MatchRecipesComponent implements OnInit, OnDestroy {
  popularIngredients: { name: string; count: number }[] = [];
  protected baseSvgPath: string = '/assets/images/svg/';
  private categories: ICategory[] = []; //изначальные данные
  private sections: ISection[] = [];
  protected group: SectionGroup[] = []; //секции и соответствующие им группы

  //текущий список уникальных ингредиентов, которые есть в подходящих рецептах

  sectionStates: boolean[] = []; //расскрыты ли категории в секции
  categoryStates: boolean[][] = []; //выбрана ли категория
  protected haveToContainAllCategories: boolean = false; //должен ли рецепт содержать все выбранные категории (или хотя бы одну)

  protected selectedCategories: ICategory[] = [];
  protected selectedIngredients: string[] = [];

  protected matchingRecipes: IRecipe[] = []; //рецепты подходящие под запросы

  ingredients: IIngredient[] = [];
  protected searchQuery: string = '';
  protected destroyed$: Subject<void> = new Subject<void>();

  protected selectedIngredientsCopyForDragAndDrop: any[] = []; //для cdk drag and drop обычный массив строк не подходит поэтому так
  protected excludedIngredientsCopyForDragAndDrop: any[] = [];

  @ViewChild('autocompleteBlock') autocomplete?: ElementRef;

  constructor(
    private renderer: Renderer2,
    private matchService: MatchService,
    private authService: AuthService,
    private ingredientService: IngredientService,
    private sectionService: SectionService,
    private title: Title,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) {
    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.autocomplete) {
        if (!this.autocomplete.nativeElement.contains(e.target)) {
          this.cd.markForCheck();
        }
      }
    });
  }

  ngOnInit(): void {
    this.title.setTitle('Подбор рецептов');
    this.cd.markForCheck();
    this.authService.getTokenUser().subscribe((user) => {
      this.currentUserId = user.id;
      this.getPopularIngredients().subscribe();
    });
  }

  clearAllCategories() {}
  findIngredientByName(name: string): IIngredient {
    return this.ingredientService.findIngredientByName(name, this.ingredients);
  }

  goToMatchingRecipesPage() {
    this.router.navigate(['/recipes/matching'], {
      state: { recipes: this.matchingRecipes },
    });
  }

  private currentUserId: number = 0;

  getPopularIngredients() {
    return this.matchService.getIngredients(this.currentUserId, 15).pipe(
      tap((response) => {
        this.popularIngredients = response;
        this.cd.markForCheck();
        console.log(response);
      }),
    );
  }

  selectIngredientFromSearch(ingredient: { name: string }) {
    this.selectIngredient(ingredient.name);
  }

  sectionsInit() {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedSections: ISection[]) => {
        if (receivedSections.length > 0) {
          this.sections = [];
          this.group = [];

          this.sections = receivedSections;

          //создаем обьект sectionGroup соответствующий секции
          this.sections.forEach((section) => {
            if (section.categoriesIds.length > 0) {
              const sectionGroup: SectionGroup = {
                section: nullSection,
                categories: [],
              };
              sectionGroup.section = section;
              //берем только публичные категории
              section.categoriesIds.forEach((sectionCategoryId: number) => {
                const finded = this.categories.find(
                  (checkedCategory) =>
                    checkedCategory.id === sectionCategoryId &&
                    checkedCategory.status === 'public',
                );
                if (finded) sectionGroup.categories.push(finded);
              });
              //не добавляем секции без категорий с рецептами
              if (sectionGroup.categories.length > 0)
                this.group.push(sectionGroup);
            }
          });
        }
        this.categoryStates = this.group.map((sectionGroup) => {
          return sectionGroup.categories.map(() => false);
        }); //создаем массив со всеми значениями false соответствующий секция-категории
        this.cd.markForCheck();
      });
  }

  clearCategories() {}

  selectIngredient(name: string) {
    if (!this.selectedIngredients.find((si) => si === name)) {
      this.selectedIngredients.push(name);
            this.selectedIngredientsCopyForDragAndDrop.push(name);

    }
  }

  toogleCondition(toogleTo: boolean) {
    this.haveToContainAllCategories = toogleTo;
  }

  clearAllIngredients() {
    this.selectedIngredients = [];
    this.selectedIngredientsCopyForDragAndDrop = [];
  }
  excludedIngredients: string[] = [];
  clearAllExcludedIngredients() {
    this.excludedIngredients = [];
    this.excludedIngredientsCopyForDragAndDrop = [];
  }
  containIngredient(name: string) {
    return this.selectedIngredients.find((si) => si === name);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.selectedIngredients = this.selectedIngredientsCopyForDragAndDrop;
    this.excludedIngredients = this.excludedIngredientsCopyForDragAndDrop;
    // this.matchingRecipes =
    dragEnd();
  }

  // Метод для изменения состояния категории (раскрыть/закрыть)
  toggleCategory(sectionIndex: number, categoryIndex: number, $event: any) {
    this.categoryStates[sectionIndex][categoryIndex] =
      !this.categoryStates[sectionIndex][categoryIndex];
    const selectedCategory = this.group[sectionIndex].categories[categoryIndex];
    if (this.categoryStates[sectionIndex][categoryIndex]) {
      this.selectedCategories.push(selectedCategory);
    } else {
      const index = this.selectedCategories.indexOf(selectedCategory);
      if (index !== -1) {
        this.selectedCategories.splice(index, 1);
      }
    }
    $event.preventDefault();
    $event.stopPropagation();
  }

  getZoom(count: number): number {
    return getZoom(count, 0.15, 5, 0.9);
  }

  ingredientClick(ingredient: string, $event: any) {
    this.selectIngredient(ingredient);
    $event.preventDefault();
    $event.stopPropagation();
  }

  protected dragStart() {
    dragStart();
  }

  toggleSection(sectionIndex: number, $event: any) {
    this.sectionStates[sectionIndex] = !this.sectionStates[sectionIndex];
    $event.preventDefault();
    $event.stopPropagation();
  }

  findRecipes() {
    this.matchService
      .getRecipes(this.selectedIngredients, this.excludedIngredients, this.currentUserId)
      .subscribe((res) => {
        console.log(res);
      });
  }

  protected autoIngredients: string[] = [];

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
