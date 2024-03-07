import { trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { heightAnim, modal } from 'src/tools/animations';
import { IUser, nullUser } from '../../models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import {
  Permission,
  managersPreferences,
  sections,
  social,
  steps,
  stepsIcons,
} from './conts';
import { EMPTY, Subject, catchError, finalize, tap } from 'rxjs';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { ThemeService } from 'src/app/modules/common-pages/services/theme.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { passMask } from 'src/tools/regex';
import { customPatternValidator } from 'src/tools/validators';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Output() closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() user: IUser = { ...nullUser };
  permissionNotificationSections = sections;
  managersPreferences = managersPreferences;
  stepsIcons = stepsIcons;

  protected permanentIngredient: string = '';
  protected permanentIngredientTouched = false;
  protected excludedIngredient: string = '';
  protected excludedIngredientTouched = false;


  protected exitModalShow: boolean = false;
  protected deleteModalShow: boolean = false;
  protected permanentIngredients: string[] = [];
  protected excludingIngredients: string[] = [];

  protected location: string = '';


  protected socials: social[] = ['pinterest', 'vk', 'twitter', 'facebook'];

  protected steps = steps;
  protected step: number = 0;

  private destroyed$: Subject<void> = new Subject<void>();

  form: FormGroup;
  currentUser: IUser = nullUser;
  deleteMode = false;
  successDeleteModal = false;
  errorModal = false;
  errorText = '';

  loading = false;

  get passwordNotValidError() {
    return this.form.get('password')?.invalid &&
      (this.form.get('password')?.dirty || this.form.get('password')?.touched)
      ? 'Пароль должен содержать от 8 до 20 символов, среди которых как минимум: одна цифра, одна заглавная и строчная буква английского алфавита'
      : '';
  }

  get permanentIngredientExist(): boolean {
    const formattedIngredients = this.permanentIngredients.map((ingredient) =>
      ingredient.trim().toLowerCase(),
    );
    const formattedIngredient = this.permanentIngredient.trim().toLowerCase();
    const isIngredientAlreadyAdded =
      formattedIngredients.includes(formattedIngredient);
    return isIngredientAlreadyAdded;
  }
  get excludedIngredientExist(): boolean {
    const formattedIngredients = this.excludingIngredients.map((ingredient) =>
      ingredient.trim().toLowerCase(),
    );
    const formattedIngredient = this.excludedIngredient.trim().toLowerCase();
    const isIngredientAlreadyAdded =
      formattedIngredients.includes(formattedIngredient);
    return isIngredientAlreadyAdded;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private themeService: ThemeService,
    private userService: UserService,
  ) {
    this.location = 'https://' + window.location.host;

    this.form = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          customPatternValidator(passMask),
        ],
      ],
    });
  }

  public ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user.id !== this.currentUser.id && user.id) {
        this.userService
          .getLimitations(user.id)
          .pipe(
            tap((limitations) => {
              this.currentUser.limitations = limitations;
              this.authService.setCurrentUser(this.currentUser)
            }),
          )
          .subscribe();
      }
      this.currentUser = user;
    });

    addModalStyle(this.renderer);

    // this.permissions = this.user.permissions ? this.user.permissions : [];
    //   this.permanentIngredients = this.user.permanent
    //     ? this.user.permanent
    //     : [];
    //   this.excludingIngredients = this.user.exclusions
    //     ? this.user.exclusions
  }

  deleteIngredient(context: 'permanent' | 'excluding', ingredient: string) {
    if (context === 'permanent') {
      this.permanentIngredients = this.permanentIngredients.filter(
        (i) => i !== ingredient,
      );
      this.user.permanent = this.permanentIngredients;
    } else {
      this.excludingIngredients = this.excludingIngredients.filter(
        (i) => i !== ingredient,
      );
      this.user.exclusions = this.excludingIngredients;
    }
    // USER this.updateUser(this.user);
  }

  showBlock(i: number) {
    if (this.user.role === 'user' && i === 4)
      return false;
    return true;
  }

  protected addPermanentIngredient(): void {
    if (!this.user.permanent) this.user.permanent = [];
    this.user.permanent.push(this.permanentIngredient);
    // USER this.updateUser(this.user);
    this.permanentIngredientTouched = false;
    this.permanentIngredient = '';
  }

  protected addExcludedIngredient(): void {
    if (!this.user.exclusions) this.user.exclusions = [];
    this.user.exclusions.push(this.excludedIngredient);
    // USER this.updateUser(this.user);
    this.excludedIngredientTouched = false;
    this.excludedIngredient = '';
  }

  protected nightModeEmit() {
    this.themeService.changeTheme();
  } //переключ темной темы

  protected userPermissionEnabled(context: Permission): boolean {
    //разрешены ли конкретные уведомления
    //если уведов нет или оно не установлено то считаю что можно
    if (this.currentUser.limitations) {
      const findedLimitation = this.currentUser.limitations?.find((p) => p === context);
      if (findedLimitation) return false;
    }

    return true;
  }

  protected tooglePermission(
    //изменение значения разрешения на уведомления
    context: Permission,
  ): void {
    const limitation = this.currentUser.limitations?.find((p) => p === context);
    if (limitation) {
      this.loading = true;
      this.userService
        .deleteLimitation(this.currentUser.id, context)
        .pipe(
          tap(() => { 
            this.currentUser.limitations = this.currentUser.limitations?.filter(l => l !== limitation);
          }),
          finalize(() => {
            this.loading = false;this.addModalStyle();
            this.cd.markForCheck();
          })
        )
        .subscribe();
    } else {
      this.userService
        .postLimitation(this.currentUser.id, context)
        .pipe(
          tap(() => {
          
            this.currentUser.limitations?.push(context);
          }),
          finalize(() => {
            this.loading = false;this.addModalStyle();
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  async handleExitModal(event: boolean) {
    this.exitModalShow = false;
    if (event) {
      this.loading = true;
      this.authService.logout().subscribe(() => {
        this.authService.setCurrentUser(nullUser);
        this.loading = false;
        this.router.navigateByUrl('/');
      });
    } else {
      addModalStyle(this.renderer);
    }
  }

  addModalStyle() {
    addModalStyle(this.renderer)
  }

  handleDeleteModal(answer: boolean) {
    this.deleteModalShow = false;

    this.loading = true;
    this.cd.markForCheck();

    const password = this.form.value.password;

    if (answer) {
      this.authService
        .requestUserDeletion(this.currentUser.id, password)
        .pipe(
          tap(() => {
            this.successDeleteModal = true;
          }),
          catchError((response) => {
            const error = response.error.message;
            this.errorText = error || '';
            this.errorModal = true;
            return EMPTY;
          }),
          finalize(() => {
            this.loading = false; this.addModalStyle();
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    } else {
      addModalStyle(this.renderer);
    }
  }

  protected clickBackgroundNotContent(elem: Event): void {
    //обработка нажатия на фон настроек, но не на блок с настройками
    if (elem.target !== elem.currentTarget) return;
    this.closeEmitter.emit(true);
  }

  //cкрытие/добавление прокрутки к основному содержимому

  public ngOnDestroy(): void {
    removeModalStyle(this.renderer);
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
