import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { palette } from './palette';
import { PlanService } from '../services/plan.service';
import { nullCalendarEvent } from '../models/plan';
import { CalendarService } from '../services/calendar.service';
import { IUser, nullUser } from '../../user-pages/models/users';
import { IRecipe, nullRecipe } from '../../recipes/models/recipes';
import { Router } from '@angular/router';
import { RecipeService } from '../../recipes/services/recipe.service';
import { UserService } from '../../user-pages/services/user.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { EMPTY, Subject, catchError, finalize, tap } from 'rxjs';
import { endOfDay, startOfDay } from 'date-fns';
import { NotificationService } from '../../user-pages/services/notification.service';
import { getModalDescription, getModalTitle } from './const';
import {
  INotification,
  nullNotification,
} from '../../user-pages/models/notifications';
import { ICalendarDbEvent, RecipeCalendarEvent } from '../models/calendar';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { AuthService } from '../../authentication/services/auth.service';
import { Permission } from '../../user-pages/components/settings/conts';
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
  @Input() event: RecipeCalendarEvent = nullCalendarEvent;
  currentUser: IUser = { ...nullUser };
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() editEmitter = new EventEmitter<RecipeCalendarEvent>();

  protected title: string = '';
  protected colors: string[] = palette;
  protected start: Date = startOfDay(new Date());
  protected end: Date | undefined = endOfDay(new Date());
  protected selectedColorIndex: number = 0;
  protected customColor = '#ff3867';
  protected colorSource: 'palette' | 'custom' = 'palette';
  protected editMode: boolean = false;
  protected searchQuery: string = '';
  protected selectedRecipe: IRecipe = nullRecipe;
  protected destroyed$: Subject<void> = new Subject<void>();
  protected modalExitShow: boolean = false;
  protected modalSuccessSaveShow: boolean = false;
  protected modalSaveShow: boolean = false;

  get valid() {
    return this.title.length > 2 &&
      this.start &&
      (this.end ? this.start <= this.end : true)
      ? true
      : false;
  }

  constructor(
    private planService: PlanService,
    private calendarService: CalendarService,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private router: Router,
    private notifyService: NotificationService,
    private authService: AuthService,
    private recipeService: RecipeService,
    private userService: UserService,
  ) {}

  public ngOnInit(): void {
    addModalStyle(this.renderer);
    this.currentUserInit();
    this.editingRecipeInit();
  }

  currentUserInit() {
    this.authService.currentUser$.subscribe((receivedUser: IUser) => {
      this.currentUser = receivedUser;
    });
  }

  private editingRecipeInit() {
    if (this.event.id) {
      if (Number(this.event.id) > 0) {
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

      if (this.event.recipe) {
        this.recipeService
          .getMostShortedRecipe(this.event.recipe)
          .pipe(
            tap((recipe) => {
              this.selectedRecipe = recipe;
              this.searchQuery = recipe.name;
              this.cd.markForCheck();
            }),
            catchError(() => {
              this.event.recipe = 0;
              return EMPTY;
            }),
          )
          .subscribe();
      }
    }
  }

  blur() {
    if (
      !(this.searchQuery === this.selectedRecipe.name && this.selectedRecipe.id)
    ) {
      this.selectedRecipe = nullRecipe;
      this.searchQuery = '';
    }
  }

  selectRecipe(recipe: IRecipe) {
    this.selectedRecipe = recipe;
    this.searchQuery = this.selectedRecipe.name;
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

  private editEvent() {
    const color = this.colors[this.selectedColorIndex];
    const editedEvent = this.calendarService.createCalendarEvent(
      this.selectedRecipe.id,
      this.start,
      this.title,
      this.colorSource === 'custom' ? this.customColor : color,
      this.end,
    );

    if (!this.end) editedEvent.allDay = true;
    else if (
      this.start.toString() === startOfDay(this.start).toString() &&
      this.end?.setSeconds(59, 999).toString() ===
        endOfDay(this.end).setSeconds(59).toString()
    ) {
      editedEvent.allDay = true;
    }
    if (
      this.end?.setSeconds(59, 999).toString() ===
      endOfDay(this.start).setSeconds(59).toString()
    ) {
      this.end = new Date(this.end.setSeconds(50).toString());
    }

    this.newEvent = { ...editedEvent, id: Number(this.event.id) };

    

    const newDbEvent: ICalendarDbEvent = {
      title: editedEvent.title,
      recipeId: editedEvent.recipe,
      color: editedEvent.color?.primary || '',
      start: editedEvent.start,
      userId: this.currentUser.id,
      wholeDay: editedEvent.allDay ? 1 : 0,
      id: Number(this.event.id),
      end: editedEvent.end,
    };

    this.loading = true;
    this.cd.markForCheck();

    this.planService
      .updateEvent(newDbEvent)
      .pipe(
        tap(() => {
          this.modalSuccessSaveShow = true;
        }),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe();
  }
  loading = false;

  newEvent: RecipeCalendarEvent = nullCalendarEvent;

  addEvent() {
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

    if (
      this.end?.setSeconds(59, 999).toString() ===
      endOfDay(this.start).setSeconds(59).toString()
    ) {
      this.end = new Date(this.end.setSeconds(50).toString());
    }
    const newDbEvent: ICalendarDbEvent = {
      title: newEvent.title,
      recipeId: newEvent.recipe,
      color: newEvent.color?.primary || '',
      start: newEvent.start,
      userId: this.currentUser.id,
      wholeDay: newEvent.allDay ? 1 : 0,
      id: 0,
      end: newEvent.end,
    };

    const newRecipeEvent: RecipeCalendarEvent = {
      ...newDbEvent,
      title: newEvent.title,
      recipe: newEvent.recipe || 0,
      color: newEvent.color,
      start: newEvent.start,
      allDay: newEvent.allDay,
    };

    this.loading = true;
    this.cd.markForCheck();

    this.newEvent = newEvent;

    this.planService
      .postEvent(newDbEvent)
      .pipe(
        tap((res: any) => {
          const eventId = res.id;
          newRecipeEvent.id = eventId;
          this.newEvent = newRecipeEvent;
          this.modalSuccessSaveShow = true;
          if (this.selectedRecipe.id)
            this.notifyRecipeAuthor(this.selectedRecipe);
        }),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe();
  }

  notifyRecipeAuthor(recipe: IRecipe) {
    if (recipe.authorId !== this.currentUser.id) {
      const authorId = recipe.authorId;
      if (authorId) {
        this.userService
          .getLimitation(authorId, Permission.YourRecipePlanned)
          .subscribe((limit) => {
            if (!limit) { 
const notify = this.notifyService.buildNotification(
  'Ваш рецепт запланировали',
  `Ваш рецепт «${recipe.name}» кто-то запланировал!`,
  'info',
  'calendar-recipe',
  '/recipes/list/' + recipe.id,
);
this.notifyService.sendNotification(notify, authorId).subscribe();


            }
          })
        
      }
    }
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      if (this.editMode) this.editEvent();
      else this.addEvent();
    } else
      setTimeout(() => {
        addModalStyle(this.renderer);
      }, 0);
    this.modalSaveShow = false;
  }
  handleExitModal(answer: boolean) {
    if (answer) this.closeEmitter.emit(true);
    else
      setTimeout(() => {
        addModalStyle(this.renderer);
      }, 0);

    this.modalExitShow = false;
  }
  handleSuccessSaveModal() {
    this.modalSuccessSaveShow = false;
    this.closeEmitter.emit(true);
    this.editEmitter.emit(this.newEvent);
    //this.userService.getPermission('you-plan-recipe')

    if (this.userService.getPermission(this.currentUser.limitations || [], Permission.YouPlannedRecipe)) {
      let notify: INotification = nullNotification;

    
  
      if (!this.editMode) {
        notify = this.notifyService.buildNotification(
          'Вы успешно запланировали рецепт',
          `Вы успешно запланировали рецепт «${this.title}» в «Календаре рецептов»`,
          'success',
          'calendar-recipe',
          '/plan/calendar',
        );
      } else {
        notify = this.notifyService.buildNotification(
          'Вы успешно изменили запланированный рецепт',
          `Вы успешно изменили запланированный рецепт «${this.title}» в «Календаре рецептов»`,
          'success',
          'calendar-recipe',
          '/plan/calendar',
        );
      }
      this.notifyService
        .sendNotification(notify, this.currentUser.id, true)
        .subscribe();
    }
  }

  getModalDescription(type: 'success' | 'save' | 'exit'): string {
    return getModalDescription(type, this.editMode);
  }

  getModalTitle(type: 'success' | 'save' | 'exit'): string {
    return getModalTitle(this.editMode, type);
  }

  protected close() {
    return this.noChanges
      ? this.closeEmitter.emit(true)
      : (this.modalExitShow = true);
  }

  public ngOnDestroy(): void {
    removeModalStyle(this.renderer);
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
