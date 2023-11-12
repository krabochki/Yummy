/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { steps, Step } from './consts';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { IRecipe } from '../../../models/recipes';
import { RecipeService } from '../../../services/recipe.service';
import { Observable, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { customLinkPatternValidator } from 'src/tools/validators';
import { anySiteMask } from 'src/tools/regex';
import {
  ProductType,
  productTypes,
} from 'src/app/modules/planning/models/shopping-list';
import { IngredientService } from '../../../services/ingredient.service';
import {
  ExternalLink,
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
} from '../../../models/ingredients';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import {
  INotification,
  nullNotification,
} from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

@Component({
  selector: 'app-ingredient-create',
  templateUrl: './ingredient-create.component.html',
  styleUrls: ['./ingredient-create.component.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientCreateComponent implements OnInit, OnDestroy {
  @ViewChild('input', { static: false }) input: ElementRef | undefined;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;
  @Output() closeEmitter = new EventEmitter<boolean>();

  currentStep: number = 0;
  showInfo = false;
  steps: Step[] = steps;

  form: FormGroup;

  selectedIngredientsGroups: IIngredientsGroup[] = [];

  protected productTypes = productTypes;
  protected selectedType: ProductType = productTypes[0];
  protected searchQuery: string = '';
  protected autocompleteShow: boolean = false;
  protected autocompleteTypes: ProductType[] = [];
  protected focused: boolean = false;

  exitModalShow: boolean = false;

  images: string[][] = [['']];
  defaultImage: string = '../../../../../assets/images/add-ingredient.png';
  mainImage: string = '';

  protected destroyed$: Subject<void> = new Subject<void>();

  beginningData: any;

  groups: IIngredientsGroup[] = [];

  constructor(
    private renderer: Renderer2,
    private ingredientService: IngredientService,
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    public router: Router,
    private cd:ChangeDetectorRef
  ) {
    this.mainImage = this.defaultImage;
    this.form = this.fb.group({
      ingredientName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ],
      search: '',
      description: ['', Validators.maxLength(5000)],
      history: ['', [Validators.maxLength(5000)]],
      origin: ['', [Validators.maxLength(20)]],
      nutritions: this.fb.array([]),
      contraindicates: this.fb.array([]),
      precautions: this.fb.array([]),
      compatibleDishes: this.fb.array([]),
      cookingMethods: this.fb.array([]),
      tips: this.fb.array([]),
      storageMethods: this.fb.array([]),
      recommendations: this.fb.array([]),
      sources: this.fb.array([]),
      advantages: this.fb.array([]),
      variations: this.fb.array([]),
      disadvantages: this.fb.array([]),
      image: [null], // Это поле для загрузки картинки
    });
  }

  ngOnInit(): void {
    this.addModalStyle();

    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser));

    this.ingredientService.ingredientsGroups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedIngredientsGroups: IIngredientsGroup[]) =>
          (this.groups = receivedIngredientsGroups.filter((g) => g.id !== 0)),
      );

    this.beginningData = this.form.getRawValue();
  }

  get validForm() {
    return (
      this.form.valid &&
      this.areObjectsEqual() &&
      this.selectedIngredientsGroups.length > 0
    );
  }

  closeIngredientCreating(): void{
    if (!this.areObjectsEqual() && this.selectedIngredientsGroups.length === 0) {
      this.closeEmitter.emit()
    }
    else {
      this.exitModalShow = true;
    }
  }

  f(field: string): FormArray {
    return this.form.get(field) as FormArray;
  }

  protected blur(): void {
    if (this.searchQuery !== '' && this.searchQuery !== this.selectedType.name)
      this.searchQuery = '';

    this.autocompleteShow = false;
    this.focused = false;
  }

  addGroup(event: IIngredientsGroup) {
    if (this.selectedIngredientsGroups.length < 5) {
      const findedCategory: IIngredientsGroup | undefined =
        this.selectedIngredientsGroups.find((group) => group.id === event.id);
      if (findedCategory === undefined) {
        this.selectedIngredientsGroups.push(event);
      }
    }
  }
  removeGroup(event: IIngredientsGroup) {
    this.selectedIngredientsGroups = this.selectedIngredientsGroups.filter(
      (group) => {
        if (group.id !== event.id) return true;
        else return false;
      },
    );
  }

  protected focus(): void {
    this.autocompleteShow = true;
    this.recipeSearching();
  }
  protected chooseRecipe(type: ProductType): void {
    this.searchQuery = type.name;
    this.selectedType = type;
  }
  protected recipeSearching(): void {
    this.autocompleteShow = true;
    this.focused = true;
    if (this.searchQuery) {
      this.autocompleteTypes = [];
      if (this.selectedType.name !== this.searchQuery) {
        const without = this.productTypes.find(
          (p) => p.name === 'Без категории',
        );
        if (without) this.selectedType = without;
      }
      const search = this.searchQuery.toLowerCase().replace(/\s/g, '');

      const filterTypes: ProductType[] = this.productTypes.filter(
        (type: ProductType) =>
          type.name.toLowerCase().replace(/\s/g, '').includes(search),
      );

      filterTypes.forEach((element) => {
        this.autocompleteTypes.push(element);
      });
    } else this.autocompleteTypes = [...this.productTypes];
  }

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;

      this.scrollTop();
    }
  }
  goToNextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.scrollTop();
    }
  }
  scrollTop(): void {
    if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
  }

  drop(context: string, event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.f(context).controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  mainPhotoChange(event: any) {
    const input = event.target as HTMLInputElement;
    const mainpicFile: File | undefined = input.files?.[0];

    if (mainpicFile) {
      const mainPicData = new FormData();
      mainPicData.append('file', mainpicFile);
      this.form.get('image')?.setValue(mainPicData);

      const objectURL = URL.createObjectURL(mainpicFile);
      this.mainImage = objectURL;
    }
  }

  addNutrition() {
    this.f('nutritions').push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(20),
          ],
        ],
        quantity: ['', [Validators.maxLength(6)]],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }
  addSource() {
    this.f('sources').push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        link: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(1000),
          ],
          customLinkPatternValidator(anySiteMask),
        ],
      }),
    );
  }
  removeBaseTextControl(index: number, controlGroup: string) {
    this.f(controlGroup).removeAt(index);
  }
  addBaseTextControl(controlGroup: string) {
    let maxLength = 500;
    if (controlGroup === 'variations') maxLength = 50;
    this.f(controlGroup).push(
      this.fb.group({
        content: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(maxLength),
          ],
        ],
      }),
    );
  }

  submitForm(): void {
    this.createModalShow = true;
  }

  createModalShow: boolean = false;

  handleCreateModal(answer: boolean) {
    if (answer) {
      this.createIngredient();
    } else {
      this.addModalStyle();
    }
    this.createModalShow = false;
  }

  get isManager() {
    return this.currentUser.role !== 'user';
  }
  currentUser: IUser = nullUser;

  createIngredient(): void {
    let maxId = 0;
    this.ingredientService.ingredients$
      .subscribe((receivedIngredients: IIngredient[]) => {
        const ingredients: IIngredient[] = receivedIngredients;
        maxId = Math.max(...ingredients.map((u) => u.id));

     
      });
    
       const externalLinks: ExternalLink[] = [];
       this.f('sources').controls.forEach((control) => {
         const externalLink: ExternalLink = {
           link: control.get('link')?.value,
           name: control.get('name')?.value,
         };
         externalLinks.push(externalLink);
       });

       if (this.form.valid && this.selectedIngredientsGroups.length > 0) {
         const newIngredientData: IIngredient = {
           id: maxId + 1,
           name: this.form.value.ingredientName,
           history: this.form.value.history,
           description: this.form.value.description,
           variations: this.form.value.variations,
           status: this.isManager ? 'public' : 'awaits',
           image: this.form.value.image,
           advantages: this.form.value.advantages,
           disadvantages: this.form.value.disadvantages,
           recommendedTo: this.form.value.recommendations,
           contraindicatedTo: this.form.value.contraindicates,
           origin: this.form.value.origin,
           precautions: this.form.value.precautions,
           compatibleDishes: this.form.value.compatibleDishes,
           cookingMethods: this.form.value.cookingMethods,
           tips: this.form.value.tips,
           nutritions: this.form.value.nutritions,
           storageMethods: this.form.value.storageMethods,
           externalLinks: externalLinks,
           shoppingListGroup: this.selectedType.id,
         };

         this.createdIngredient = newIngredientData;

         this.ingredientService
           .postIngredient(newIngredientData)
           .subscribe(() => {
             const subscribes: Observable<IIngredientsGroup>[] = [];
             this.selectedIngredientsGroups.forEach((group) => {
               group.ingredients.push(newIngredientData.id);
               subscribes.push(
                 this.ingredientService.updateIngredientGroup(group),
               );
             });
             forkJoin(subscribes).subscribe(
               () => {
                 this.successModalShow = true;
                 this.cd.markForCheck(); 
               },
             );
           });
       }
  }
  createdIngredient: IIngredient = nullIngredient;
  successModalShow = false;
  handleSuccessModal() {
    this.successModalShow = false;
    this.closeEmitter.emit();
    let notification: INotification = nullNotification;
    if (this.isManager) {
      const createdIngredientLink =
        '/ingredients/list/' + this.createdIngredient.id;
      if (
        this.userService.getPermission(
          'your-ingredient-published',
          this.currentUser,
        )
      ) {
        notification = this.notificationService.buildNotification(
          'Ингредиент опубликован',
          `Созданный вами ингредиент «${this.createdIngredient.name}» успешно опубликован`,
          'success',
          'ingredient',
          createdIngredientLink,
        );

        this.notificationService
          .sendNotification(notification, this.currentUser)
          .subscribe(() => this.router.navigateByUrl(createdIngredientLink));
      }
    } else {
      if (
        this.userService.getPermission(
          'you-create-ingredient',
          this.currentUser,
        )
      ) {
        notification = this.notificationService.buildNotification(
          'Ингредиент создан',
          `Созданный вами ингредиент «${this.createdIngredient.name}» успешно создан и отправлен на проверку`,
          'success',
          'ingredient',
          '',
        );
        this.notificationService
          .sendNotification(notification, this.currentUser)
          .subscribe();
      }
    }
  }

  // if (this.form.valid) {
  //   const recipeData: IRecipe = {
  //     name: this.form.value.ingredientName,
  //     reports: [],
  //     statistics: [],
  //     ingredients: this.form.value.ingredients,
  //     instructions: this.form.value.instructions,
  //     mainImage: this.form.value.image,
  //     description: this.form.value.description,
  //     history: this.form.value.history,
  //     preparationTime: this.form.value.preparationTime,
  //     cookingTime: this.form.value.cookingTime,
  //     origin: this.form.value.origin,
  //     nutritions: this.form.value.nutritions,
  //     servings: this.form.value.portions,
  //     authorId: this.currentUser.id,
  //     categories: categoriesIds,
  //     cooksId: [],
  //     likesId: [],
  //     favoritesId: [],
  //     id: this.recipeId,
  //     comments: [],
  //     publicationDate: getCurrentDate(),
  //     status: this.isAwaitingApprove
  //       ? this.currentUser.role === 'user'
  //         ? 'awaits'
  //         : 'public'
  //       : 'private',
  //   };
  //   this.createdRecipe = recipeData;

  //   this.recipeService.postRecipe(recipeData).subscribe(() => {
  //     this.successModalShow = true;

  //     this.cd.markForCheck();
  //   });
  // }

  getNameOfControlGroup(controlGroup: string): string {
    switch (controlGroup) {
      case 'advantages':
        return 'Преимущества';
      case 'disadvantages':
        return 'Недостатки';
      case 'recommendations':
        return 'Рекоммендации';
      case 'contraindicates':
        return 'Противопоказания';
      case 'cookingMethods':
        return 'Способы приготовления';
      case 'compatibleDishes':
        return 'Сочетания';
      case 'precautions':
        return 'Меры предосторожности';
      case 'tips':
        return 'Советы';
      case 'storageMethods':
        return 'Способы хранения';
      case 'variations':
        return 'Варианты написания';
    }
    return '';
  }

  stepControlGroups = [
    ['advantages', 'disadvantages', 'recommendations', 'contraindicates'],
    ['cookingMethods', 'compatibleDishes', 'precautions'],
    ['tips', 'storageMethods'],
  ];

  getInputPlaceholderOfControlGroup(controlGroup: string): string {
    switch (controlGroup) {
      case 'advantages':
        return 'Содержание преимущества';
      case 'disadvantages':
        return 'Содержание недостатка';
      case 'recommendations':
        return 'Содержание рекоммендации';
      case 'contraindicates':
        return 'Содержание противопоказания';
      case 'cookingMethods':
        return 'Описание способа приготовления';
      case 'compatibleDishes':
        return 'Описание сочетания';
      case 'precautions':
        return 'Описание меры предосторожности';
      case 'tips':
        return 'Содержание совета';
      case 'storageMethods':
        return 'Описание способа хранения';
      case 'variations':
        return 'Название варианта написания';
    }
    return '';
  }

  handleExitModal(answer: boolean): void {
    this.exitModalShow = false;

    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      this.addModalStyle();
    }
  }

  addModalStyle() {
    setTimeout(() => {
      this.renderer.addClass(document.body, 'hide-overflow');
      (<HTMLElement>document.querySelector('.header')).style.width =
        'calc(100% - 16px)';
    }, 0);
  }

  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }
  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.areObjectsEqual()
      ? (this.exitModalShow = true)
      : this.closeEmitter.emit(true);
  }
  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
