import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { palette } from './palette';
import { PlanService } from '../services/plan-service';
import { IPlan, nullCalendarEvent, nullPlan } from '../models/plan';
import { CalendarService } from '../services/calendar.service';
import { CalendarEvent } from 'angular-calendar';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IRecipe, nullRecipe } from '../../recipes/models/recipes';
import { Router } from '@angular/router';
import { RecipeService } from '../../recipes/services/recipe.service';
import { UserService } from '../../user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Subject, takeUntil } from 'rxjs';
import { startOfDay } from 'date-fns';
@Component({
  selector: 'app-add-calendar-event',
  templateUrl: './add-calendar-event.component.html',
  styleUrls: ['./add-calendar-event.component.scss'],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
})
export class AddCalendarEventComponent implements OnInit, OnDestroy {
  @Input() plan: IPlan = nullPlan;
  @Input() event: CalendarEvent = nullCalendarEvent;
  @Input() currentUser: IUser = nullUser;
  @Output() closeEmitter = new EventEmitter<boolean>();

  protected title: string = '';
  protected colors: string[] = palette;
  protected date: Date = startOfDay(new Date());
  protected selectedColorIndex: number = 0;

  protected editMode: boolean = false;

  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocompleteRecipes: IRecipe[] = [];

  protected focused: boolean = false;
  protected selectedRecipe: IRecipe = nullRecipe;
  private allUsers: IUser[] = [];
  private allRecipes: IRecipe[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private planService: PlanService,
    private calendarService: CalendarService,
    private renderer: Renderer2,
    private router: Router,
    private recipeService: RecipeService,
    private userService: UserService,
  ) {}

  public ngOnInit(): void {
    this.applyModalStyle();
    this.getRecipes();
    this.getUsers();
    this.editingRecipeInit();
  }

  private editingRecipeInit() {
    if (this.event.id !== 0) {
      this.editMode = true;
      this.title = this.event.title;
      this.date = this.event.start;
      this.selectedColorIndex = this.colors.findIndex(
        (i) => i === this.colors.find((c) => c === this.event.color?.primary),
      );
      const findedRecipe = this.allRecipes.find(
        (r) => r.id === this.event.recipeId,
      );
      if (findedRecipe) {
        this.chooseRecipe(findedRecipe);
        this.searchQuery = findedRecipe.name;
      }
    }
  }

  private getRecipes(): void {
    this.recipeService.recipes$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedRecipes) => {
        this.allRecipes = this.recipeService.getPublicAndAllMyRecipes(
          receivedRecipes,
          this.currentUser.id,
        );
      });
  }

  private getUsers(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUsers) => {
        this.allUsers = receivedUsers;
      });
  }

  private applyModalStyle(): void {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    this.renderer.addClass(document.body, 'hide-overflow');
  }

  protected clickBackgroundNotContent(elem: Event): void {
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  protected selectColor(index: number): void {
    this.selectedColorIndex = index;
  }

  protected editEvent(): void {
    const color = this.colors[this.selectedColorIndex];
    const newEvent = this.calendarService.createCalendarEvent(
      this.event.recipeId,
      this.date,
      this.title,
      color,
    );
    if (this.selectedRecipe.id !== 0)
      newEvent.recipeId = this.selectedRecipe.id;
    newEvent.id = this.event.id;
    const findedEventIndex = this.plan.calendarEvents.findIndex(
      (c) => c === this.plan.calendarEvents.find((event) => event.id === newEvent.id),
    );
    this.plan.calendarEvents[findedEventIndex] = newEvent;
    this.planService.updatePlan(this.plan).subscribe();
    this.closeEmitter.emit(true);
  }

  protected addEvent(): void {
    const color = this.colors[this.selectedColorIndex];
    const newEvent = this.calendarService.createCalendarEvent(
      0,
      this.date,
      this.title,
      color,
    );

    if (this.selectedRecipe.id !== 0)
      newEvent.recipeId = this.selectedRecipe.id;
    let maxId = 0;
    if (this.plan.calendarEvents.length > 0)
      maxId = Math.max(...this.plan.calendarEvents.map((e) => e.id));
    newEvent.id = maxId + 1;
    this.plan.calendarEvents = [...this.plan.calendarEvents, newEvent];
    this.planService.updatePlan(this.plan).subscribe();
    this.closeEmitter.emit(true);
  }

  //поиск рецептов
  protected blur():void {
    if (this.selectedRecipe.id === 0) this.searchQuery = '';
    this.autocompleteShow = false;
    this.focused = false;
  }
  protected getUser(userId: number): IUser {
    const finded = this.allUsers.find((user) => user.id === userId);
    if (finded) return finded;
    return { ...nullUser };
  }
  protected focus():void {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }
  protected navigateTo(link: string):void {
    this.router.navigateByUrl(link);
  }
  protected chooseRecipe(recipe: IRecipe):void {
    this.searchQuery = recipe.name;
    this.selectedRecipe = recipe;
  }
  protected recipeSearching():void {
    this.autocompleteShow = true;
    this.focused = true;

    const recipeAuthors: IUser[] = [];
    this.allRecipes.forEach((element) => {
      recipeAuthors.push(this.getUser(element.authorId));
    });
    if (this.searchQuery && this.searchQuery !== '') {
      this.autocompleteRecipes = [];
      this.selectedRecipe = nullRecipe;

      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      const filterRecipes: IRecipe[] = this.allRecipes.filter(
        (recipe: IRecipe) =>
          recipe.name.toLowerCase().replace(/\s/g, '').includes(search) ||
          this.getUser(recipe.authorId)
            .fullName.toLowerCase()
            .replace(/\s/g, '')
            .includes(search) ||
          this.getUser(recipe.authorId)
            .username.toLowerCase()
            .replace(/\s/g, '')
            .includes(search),
      );

      filterRecipes.forEach((element) => {
        this.autocompleteRecipes.push(element);
      });
    } else this.autocompleteShow = false;
  }

  public ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
