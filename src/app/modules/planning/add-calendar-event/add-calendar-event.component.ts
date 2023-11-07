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
import { Subject, find, takeUntil } from 'rxjs';
import { endOfDay, startOfDay } from 'date-fns';
import { NotificationService } from '../../user-pages/services/notification.service';
import { getFormattedDate } from 'src/tools/common';
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
  @Input() currentUser: IUser = { ...nullUser };
  @Output() closeEmitter = new EventEmitter<boolean>();

  protected title: string = '';
  protected colors: string[] = palette;
  protected start: Date = startOfDay(new Date());
  protected end: Date | undefined = endOfDay(new Date());
  protected selectedColorIndex: number = 0;

  protected customColor = '#ff3867';
  protected colorSource: 'palette' | 'custom' = 'palette';

  protected editMode: boolean = false;

  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocompleteRecipes: IRecipe[] = [];

  protected focused: boolean = false;
  protected selectedRecipe: IRecipe = nullRecipe;
  private allUsers: IUser[] = [];
  private allRecipes: IRecipe[] = [];

  protected destroyed$: Subject<void> = new Subject<void>();

  protected modalExitShow: boolean = false;
  protected modalSuccessSaveShow: boolean = false;
  protected modalSaveShow: boolean = false;

  constructor(
    private planService: PlanService,
    private calendarService: CalendarService,
    private renderer: Renderer2,
    private router: Router,
    private notifyService: NotificationService,
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
      if (this.event.id > 0) {
        this.editMode = true;
        this.start = this.event.start;
        if (this.event.end) this.end = this.event.end;
        else this.end = undefined;
        this.selectedColorIndex = this.colors.findIndex(
          (i) => i === this.colors.find((c) => c === this.event.color?.primary),
        );
        if (this.selectedColorIndex === -1 && this.event.color) {
          this.customColor = this.event.color.primary;
          this.colorSource = 'custom';
        }
      }
      this.title = this.event.title;
      const findedRecipe: IRecipe | undefined = this.allRecipes.find(
        (r) => r.id === this.event.recipe,
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

    if (this.noChanges) this.closeEmitter.emit(true);
    this.modalExitShow = true;
  }

  get noChanges(): boolean {
    if (
      this.selectedColorIndex === 0 &&
      this.colorSource === 'palette' &&
      this.title === '' &&
      this.selectedRecipe.id < 1 &&
      this.start?.toString() === startOfDay(new Date()).toString() &&
      this.end?.toString() === endOfDay(new Date()).toString()
    )
      return true;
    return false;
  }

  protected selectColor(index: number): void {
    this.selectedColorIndex = index;
    this.colorSource = 'palette';
  }
  protected selectCustomColor(): void {
    this.colorSource = 'custom';
  }

  protected editEvent(): void {
    const color = this.colors[this.selectedColorIndex];
    const newEvent = this.calendarService.createCalendarEvent(
      this.selectedRecipe.id,
      this.start,
      this.title,
      this.colorSource === 'custom' ? this.customColor : color,
      this.end,
    );
    newEvent.id = this.event.id;

    if (!this.end) newEvent.allDay = true;
    else if (
      this.start.toString() === startOfDay(this.start).toString() &&
      this.end?.setSeconds(59, 999).toString() ===
        endOfDay(this.end).setSeconds(59).toString()
    ) {
      newEvent.allDay = true;
    }

    const findedEventIndex = this.plan.calendarEvents.findIndex(
      (c) =>
        c ===
        this.plan.calendarEvents.find((event) => event.id === newEvent.id),
    );
    this.plan.calendarEvents[findedEventIndex] = newEvent;
    this.planService
      .updatePlan(this.plan)
      .subscribe(() => (this.modalSuccessSaveShow = true));
  }

  protected addEvent(): void {
    const color = this.colors[this.selectedColorIndex];
    const newEvent = this.calendarService.createCalendarEvent(
      0,
      this.start,
      this.title,
      this.colorSource === 'custom' ? this.customColor : color,
      this.end,
    );

    if (!this.end) newEvent.allDay = true;
    else if (
      (this.start.toString() === startOfDay(this.start).toString() &&
        this.end?.setSeconds(59, 999).toString() ===
          endOfDay(this.start).setSeconds(59).toString()) ||
      (this.start.toString() === startOfDay(this.start).toString() &&
        this.end?.setSeconds(59, 999).toString() ===
          endOfDay(this.end).setSeconds(59).toString())
    ) {
      newEvent.allDay = true;
    }

    if (this.selectedRecipe.id !== 0) newEvent.recipe = this.selectedRecipe.id;
    let maxId = 0;
    if (this.plan.calendarEvents.length > 0)
      maxId = Math.max(...this.plan.calendarEvents.map((e) => e.id));
    newEvent.id = maxId + 1;

    this.plan.calendarEvents = [...this.plan.calendarEvents, newEvent];
    this.planService
      .updatePlan(this.plan)
      .subscribe(() => (this.modalSuccessSaveShow = true));

    if (this.userService.getPermission('you-plan-recipe', this.currentUser)) {
      const notify = this.notifyService.buildNotification(
        'Вы успешно запланировали рецепт',
        `Вы успешно запланировали рецепт «${newEvent.title}» в «Календаре рецептов»`,
        'success',
        'calendar-recipe',
        '/plan/calendar',
      );
      this.notifyService.sendNotification(notify, this.currentUser).subscribe();
    }

    const findRecipe = this.allRecipes.find((r) => r.id === newEvent.recipe);

    if (findRecipe?.authorId !== this.currentUser.id) {
      const author = this.allUsers.find((u) => u.id === findRecipe?.authorId);

      if (author) {
        if (
          newEvent.recipe &&
          this.userService.getPermission('plan-on-your-recipe', author)
        ) {
          const notify = this.notifyService.buildNotification(
            'Ваш рецепт запланировали',
            `Ваш рецепт «${findRecipe?.name}» кто-то запланировал!`,
            'info',
            'calendar-recipe',
            '/recipes/list/' + findRecipe?.id,
          );
          this.notifyService.sendNotification(notify, author).subscribe();
        }
      }
    }
  }

  //поиск рецептов
  protected blur(): void {
    if (this.searchQuery.length === 0) {
      this.selectedRecipe = { ...nullRecipe };
    }
    if (this.selectedRecipe.id === 0) this.searchQuery = '';
    this.autocompleteShow = false;
    this.focused = false;
  }
  protected getUser(userId: number): IUser {
    const finded = this.allUsers.find((user) => user.id === userId);
    if (finded) return finded;
    return { ...nullUser };
  }
  protected focus(): void {
    if (this.searchQuery !== '') {
      this.autocompleteShow = true;
    }
  }
  protected navigateTo(link: string): void {
    this.router.navigateByUrl(link);
  }
  protected chooseRecipe(recipe: IRecipe): void {
    this.searchQuery = recipe.name;
    this.selectedRecipe = recipe;
  }
  protected recipeSearching(): void {
    this.autocompleteShow = true;
    this.focused = true;

    const recipeAuthors: IUser[] = [];
    this.allRecipes.forEach((element) => {
      recipeAuthors.push(this.getUser(element.authorId));
    });
    if (this.searchQuery && this.searchQuery !== '') {
      this.autocompleteRecipes = [];
      this.selectedRecipe = { ...nullRecipe };

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

  handleSaveModal(answer: boolean) {
    if (answer) {
      if (this.editMode) this.editEvent();
      else this.addEvent();
    } else
      setTimeout(() => {
        this.applyModalStyle();
      }, 0);
    this.modalSaveShow = false;
  }
  handleExitModal(answer: boolean) {
    if (answer) this.closeEmitter.emit(true);
    else
      setTimeout(() => {
        this.applyModalStyle();
      }, 0);

    this.modalExitShow = false;
  }
  handleSuccessSaveModal() {
    this.modalSuccessSaveShow = false;
    this.closeEmitter.emit(true);
  }

  getModalDescription(type: 'success' | 'save' | 'exit'): string {
    if (this.editMode) {
      switch (type) {
        case 'success':
          return 'Рецепт в «Календаре рецептов» успешно изменен!';
        case 'save':
          return 'Вы уверены, что хотите изменить рецепт в плане?';
        default:
          return 'Вы уверены, что не хотите изменять рецепт в плане?';
      }
    } else {
      switch (type) {
        case 'success':
          return 'Рецепт успешно добавлен в «Календарь рецептов»!';
        case 'save':
          return 'Вы уверены, что хотите добавить рецепт в план?';
        default:
          return 'Вы уверены, что не хотите добавить рецепт в план?';
      }
    }
  }

  getModalTitle(type: 'success' | 'save' | 'exit'): string {
    if (this.editMode) {
      switch (type) {
        case 'success':
          return 'Рецепт изменен';
        case 'save':
          return 'Подтвердите изменение';
      }
    } else {
      switch (type) {
        case 'success':
          return 'Рецепт добавлен';
        case 'save':
          return 'Подтвердите добавление';
      }
    }
    return 'Подтвердите выход';
  }

  public ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
