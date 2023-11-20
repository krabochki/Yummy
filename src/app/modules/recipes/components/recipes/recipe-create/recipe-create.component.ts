/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  AbstractControl,
  FormControl,
} from '@angular/forms';
import { steps, Step } from './consts';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import { Observable, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SectionService } from '../../../services/section.service';
import { SectionGroup } from 'src/app/modules/controls/autocomplete/autocomplete.component';
import { Title } from '@angular/platform-browser';
import { getCurrentDate } from 'src/tools/common';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { notifyForFollowersOfApprovedRecipeAuthor } from 'src/app/modules/authentication/components/control-dashboard/notifications';
import { customPatternValidator } from 'src/tools/validators';
import { numbers } from 'src/tools/regex';
import { IngredientService } from '../../../services/ingredient.service';
import { IIngredient } from '../../../models/ingredients';

@Component({
  selector: 'app-recipe-create',
  templateUrl: './recipe-create.component.html',
  styleUrls: ['./recipe-create.component.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCreateComponent implements OnInit, OnDestroy {
  @ViewChild('input', { static: false }) input: ElementRef | undefined;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  @Output() closeEmitter = new EventEmitter<boolean>();

  @Input() editedRecipe: IRecipe = { ...nullRecipe };

  currentStep: number = 0;
  showInfo = false;
  steps: Step[] = steps;

  currentUser: IUser = { ...nullUser };

  categoryInputValue: string = '';

  form: FormGroup;

  isAwaitingApprove = false;

  recipeId = 0;

  users: IUser[] = [];

  successModalShow = false;
  approveModalShow = false;
  exitModalShow = false;
  editModalShow = false;
  createModalShow = false;

  images: string[][] = [['']];
  defaultImage: string = '../../../../../assets/images/add-main-photo.png';
  defaultInstructionImage: string =
    '../../../../../assets/images/add-photo.png';
  mainImage: string = '';

  allSections: ISection[] = [];
  allCategories: ICategory[] = [];
  selectedCategories: ICategory[] = [];
  group: SectionGroup[] = [];
  fullGroup: SectionGroup[] = [];

  createdRecipe: IRecipe = nullRecipe;

  ingredients:IIngredient[] = []

  protected destroyed$: Subject<void> = new Subject<void>();

  beginningData: any;

  editMode: boolean = false;

  constructor(
    private notifyService: NotificationService,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private categoryService: CategoryService,
    private sectionService: SectionService,
    private userService: UserService,
    private recipeService: RecipeService,
    private fb: FormBuilder,
    private ingredientService:IngredientService,
    public router: Router,
    private title: Title,
  ) {
    this.mainImage = this.defaultImage;
    this.form = this.fb.group({
      recipeName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],

      description: ['', Validators.maxLength(5000)],
      history: ['', [Validators.maxLength(5000)]],
      preparationTime: ['', [Validators.maxLength(20)]],
      cookingTime: ['', [Validators.maxLength(20)]],
      portions: [1],
      origin: ['', [Validators.maxLength(20)]],
      nutritions: this.fb.array([]),
      ingredients: this.fb.array([]),
      instructions: this.fb.array([]),
      categories: this.fb.array([]),
      image: [null], // Это поле для загрузки картинки
    });
  }


  blur() {
    this.categoryInputValue = ' ';
  }

  close() {
    this.areObjectsEqual()
      ? (this.exitModalShow = true)
      : this.closeEmitter.emit(true);
  }
  clickOnCircleStep(i: number) {
    if (this.validNextSteps() === 0 || this.validNextSteps() > i) {
      this.currentStep = i;
      this.scrollTop();
    }
  }

  notValid() {
    return this.validNextSteps();
  }

  noValidStepDescription(step: number): string {
    switch (step) {
      case 0:
        return 'Название рецепта обязательно и должно содержать от 3 до 100 символов';
      case 1:
        break;
      case 2:
        return 'У рецепта должно быть не более 5 категорий';
      case 3:
        return 'Название для каждого ингредиента рецепта обязательно и должно содержать не менее 2 и не более 50 символов';
      case 4:
        return 'Название для каждого нутриента рецепта обязательно и должно содержать не менее 2 и не более 20 символов';
      case 5:
        return 'Содержание для каждой инструкции рецепта обязательно и должно содержать не менее 2 и не более 1000 символов';
    }
    return '';
  }

  validNextSteps(): number {
    for (let s = 0; s <= 6; s++) {
      switch (s) {
        case 0:
          if (
            !(
              this.form.get('recipeName')!.valid &&
              this.form.get('history')!.valid &&
              this.form.get('description')!.valid
            )
          ) {
            return 1;
          }
          break;
        case 1:
          if (
            !(
              this.form.get('preparationTime')!.valid &&
              this.form.get('cookingTime')!.valid &&
              this.form.get('origin')!.valid &&
              this.form.get('portions')!.valid
            )
          ) {
            return 2;
          }
          break;
        case 2:
          if (!(this.selectedCategories.length <= 5)) {
            return 3;
          }
          break;
        case 3:
          if (!this.form.get('ingredients')!.valid) {
            return 4;
          }
          break;
        case 4:
          if (!this.form.get('nutritions')!.valid) {
            return 5;
          }
          break;
        case 5:
          if (!this.form.get('instructions')!.valid) {
            return 6;
          }
          break;
      }
    }
    return 0;
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    
    this.ingredientService.ingredients$.pipe(takeUntil(this.destroyed$)).subscribe(
      (receivedIngredients:IIngredient[])=>this.ingredients = receivedIngredients
    )
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((currentUser: IUser) => {
        {
          this.currentUser = currentUser;
        }
      });

    this.userService.users$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => (this.users = data));

    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ICategory[]) => {
        this.allCategories = data;

        this.sectionService.sections$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((data: ISection[]) => {
            this.allSections = data;

            this.allSections.forEach((section) => {
              if (section.categories.length > 0) {
                const sectionGroup: SectionGroup = {
                  section: nullSection,
                  categories: [],
                };
                sectionGroup.section = section;
                section.categories.forEach((element: number) => {
                  const finded = this.allCategories.find(
                    (elem) => elem.id === element && elem.status === 'public',
                  );
                  if (finded) sectionGroup.categories.push(finded);
                });
                this.group.push(sectionGroup);
                this.fullGroup.push(sectionGroup);
              }
            });
          });
      });

    if (this.editedRecipe.id !== 0) {
      this.editMode = true;
      if (this.editMode) this.title.setTitle('Создание рецепта');
      else this.title.setTitle('Изменение рецепта');

      const editedRecipe = { ...this.editedRecipe };
      this.form.get('recipeName')?.setValue(editedRecipe.name);
      this.form.get('description')?.setValue(editedRecipe.description);
      this.form.get('history')?.setValue(editedRecipe.history);
      this.form.get('preparationTime')?.setValue(editedRecipe.preparationTime);
      this.form.get('cookingTime')?.setValue(editedRecipe.cookingTime);
      this.form.get('portions')?.setValue(editedRecipe.servings);
      this.form.get('origin')?.setValue(editedRecipe.origin);
      this.form.get('cookingTime')?.setValue(editedRecipe.cookingTime);

      if (editedRecipe.mainImage !== null) {
        try {
          const mainImageData: FormData = editedRecipe.mainImage;
          const mainpicFile = mainImageData.get('file') as File;
          if (mainpicFile) {
            this.form.get('image')?.setValue(mainImageData);
            const objectURL = URL.createObjectURL(mainpicFile);
            this.mainImage = objectURL;
          }
        } catch {
          console.error('Ошибка при извлечении главной фотографии');
        }
      }

      for (let i = 1; i <= editedRecipe.nutritions.length; i++) {
        this.addNutrition();
        const nutritionsArray = this.form.get('nutritions') as FormArray;
        const nutritionGroup = nutritionsArray.at(i - 1) as FormGroup;
        const nutritionName = nutritionGroup.get('name') as FormControl;
        const nutritionQuantity = nutritionGroup.get('quantity') as FormControl;
        const nutritionUnit = nutritionGroup.get('unit') as FormControl;
        nutritionName?.setValue(editedRecipe.nutritions[i - 1].name);
        nutritionQuantity?.setValue(editedRecipe.nutritions[i - 1].quantity);
        nutritionUnit?.setValue(editedRecipe.nutritions[i - 1].unit);
      }

      for (let i = 1; i <= editedRecipe.ingredients.length; i++) {
        this.addIngredient();
        const ingredientsArray = this.form.get('ingredients') as FormArray;
        const ingredientGroup = ingredientsArray.at(i - 1) as FormGroup;
        const ingredientName = ingredientGroup.get('name') as FormControl;
        const ingredientQuantity = ingredientGroup.get(
          'quantity',
        ) as FormControl;
        const ingredientUnit = ingredientGroup.get('unit') as FormControl;
        ingredientName?.setValue(editedRecipe.ingredients[i - 1].name);
        ingredientQuantity?.setValue(editedRecipe.ingredients[i - 1].quantity);
        ingredientUnit?.setValue(editedRecipe.ingredients[i - 1].unit);
      }
      for (let i = 1; i <= editedRecipe.instructions.length; i++) {
        this.addInstruction();
        const instructionsArray = this.form.get('instructions') as FormArray;
        const instructionGroup = instructionsArray.at(i - 1) as FormGroup;
        const instructionName = instructionGroup.get('name') as FormControl;
        instructionName?.setValue(editedRecipe.instructions[i - 1].name);

        for (
          let j = 1;
          j <= editedRecipe.instructions[i - 1].images.length;
          j++
        ) {
          const imagesArray = instructionGroup.get('images') as FormArray;
          const imageControl = imagesArray.at(j - 1);
          const instructionImage: FormData = editedRecipe.instructions[i - 1]
            .images[j - 1] as FormData;
          try {
            if ((instructionImage.get('file') as File) !== null) {
              const instructionImageData: FormData | undefined =
                editedRecipe.instructions[i - 1].images[j - 1];
              if (instructionImageData && instructionImageData !== undefined) {
                const instructionFile = instructionImageData.get(
                  'file',
                ) as File;
                if (instructionFile) {
                  imageControl.setValue(instructionImageData);
                  const objectURL = URL.createObjectURL(instructionFile);
                  this.images[i][j] = objectURL;
                }
              }
            }
          } catch {
            console.error('Ошибка при извлечении фотографии инструкции');
          }
        }
      }
      for (const categoryId of editedRecipe.categories) {
        const findedCategory: ICategory | undefined = this.allCategories.find(
          (item) => item.id === categoryId,
        );
        if (findedCategory) this.selectedCategories.push(findedCategory);
      }
    }
    this.beginningData = this.form.getRawValue();
  }

  f(field: string): FormArray {
    return this.form.get(field) as FormArray;
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

  //drag&drop
  drop(context: string, event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.f(context).controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  //Работа с категориями
  addCategory(event: ICategory) {
    if (this.selectedCategories.length < 5) {
      const findedCategory: ICategory | undefined =
        this.selectedCategories.find((category) => category.id === event.id);
      if (findedCategory === undefined) {
        this.selectedCategories.push(event);
      }
    }
  }

  removeCategory(event: ICategory) {
    this.selectedCategories = this.selectedCategories.filter((myCategory) => {
      if (myCategory.id !== event.id) return true;
      else return false;
    });
  }

  //Работа с картинками
  //удаляем фото из инструкций рецепта по индеку инструкции и фото
  removeInstructionPhoto(instructionIndex: number, imageIndex: number) {
    const instructionsArray = this.form.get('instructions') as FormArray;
    const instructionGroup = instructionsArray.at(
      instructionIndex,
    ) as FormGroup;
    const imagesArray = instructionGroup.get('images') as FormArray;
    imagesArray.at(imageIndex).get('file')?.setValue(null);
    this.images[instructionIndex][imageIndex] = '';
  }

  //получаем url загруженного фото инструкции для вывода в background-image
  getInstructionPhotoURL(instructionIndex: number, imageIndex: number): string {
    return this.images &&
      this.images[instructionIndex] &&
      this.images[instructionIndex][imageIndex]
      ? this.images[instructionIndex][imageIndex]
      : this.defaultInstructionImage;
  }

  instuctionImageChange(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    instructionIndex: number,
    imageIndex: number,
  ) {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('instuctionPhoto', file);

      const instructionsArray = this.form.get('instructions') as FormArray;
      const instructionGroup = instructionsArray.at(
        instructionIndex,
      ) as FormGroup;
      const imagesArray = instructionGroup.get('images') as FormArray;
      const imageControl = imagesArray.at(imageIndex);

      const input = event.target as HTMLInputElement;
      const instuctionPicFile: File | undefined = input.files?.[0];

      if (instuctionPicFile) {
        const instuctionPicData = new FormData();
        instuctionPicData.append('file', instuctionPicFile);
        imageControl?.patchValue({
          file: instuctionPicData,
        });
        const objectURL = URL.createObjectURL(instuctionPicFile);
        if (!this.images[instructionIndex]) {
          this.images[instructionIndex] = ['']; // Инициализация массива с одним пустым URL
        }
        this.images[instructionIndex][imageIndex] = objectURL;
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  //--------------------

  createImageControl() {
    return this.fb.group({
      file: [null],
    });
  }

  addIngredient() {
    this.f('ingredients').push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        quantity: [
          '',
          [Validators.maxLength(6), customPatternValidator(numbers)],
        ],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }

  removeIngredient(index: number) {
    this.f('ingredients').removeAt(index);
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
        quantity: [
          '',
          [Validators.maxLength(6), customPatternValidator(numbers)],
        ],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }

  removeNutrition(index: number) {
    this.f('nutritions').removeAt(index);
  }

  addInstruction() {
    this.f('instructions').push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(1000),
          ],
        ],

        images: this.fb.array([
          this.createImageControl(),
          this.createImageControl(),
          this.createImageControl(),
        ]),
      }),
    );
  }

  removeInstruction(index: number) {
    this.f('instructions').removeAt(index);
  }

  getImages(instructionIndex: number): AbstractControl<any, any>[] {
    const instructionsArray = this.f('instructions');
    const instructionGroup = instructionsArray.at(
      instructionIndex,
    ) as FormGroup;
    const imagesArray = instructionGroup.get('images') as FormArray;
    return imagesArray.controls;
  }

  submitForm(): void {
    if (this.editMode) this.editModalShow = true;
    else this.createModalShow = true;
  }

  @Output() updatedRecipeEmitter = new EventEmitter<IRecipe>();

  //обработчик отправки формы
  createRecipe(): void {
    const categoriesIds: number[] = [];
    this.selectedCategories.forEach((element) => {
      categoriesIds.push(element.id);
    });
    this.recipeService.recipes$.subscribe((data) => {
      const recipes: IRecipe[] = data;
      const maxId = Math.max(...recipes.map((u) => u.id));
      this.recipeId = maxId + 1;
    });

    if (this.form.valid) {
      const recipeData: IRecipe = {
        name: this.form.value.recipeName,
        reports: [],
        statistics: [],
        ingredients: this.form.value.ingredients,
        instructions: this.form.value.instructions,
        mainImage: this.form.value.image,
        description: this.form.value.description,
        history: this.form.value.history,
        preparationTime: this.form.value.preparationTime,
        cookingTime: this.form.value.cookingTime,
        origin: this.form.value.origin,
        nutritions: this.form.value.nutritions,
        servings: this.form.value.portions,
        authorId: this.currentUser.id,
        categories: categoriesIds,
        cooksId: [],
        likesId: [],
        favoritesId: [],
        id: this.recipeId,
        comments: [],
        publicationDate: getCurrentDate(),
        status: this.isAwaitingApprove
          ? this.currentUser.role === 'user'
            ? 'awaits'
            : 'public'
          : 'private',
      };
      recipeData.ingredients.forEach((ingredient) => {
        const findedIngredient = recipeData.ingredients.find(
          (i) => i === ingredient,
        );
        if (findedIngredient) {
          findedIngredient.quantity = ingredient.quantity.replace(',', '.');
        }
      });
      this.createdRecipe = recipeData;

      this.recipeService.postRecipe(recipeData).subscribe(() => {
        this.editedRecipe = recipeData;

        this.successModalShow = true;

        this.cd.markForCheck();
      });
    }
  }

  controlInvalid(control: string, group:any) {
     return (
       group.get(control)?.invalid &&
       (group.get(control)?.dirty || group.get(control)?.touched)
     );
  }

  sendNotificationsAfterPublishingRecipe() {
    const subscribes: Observable<IUser>[] = [];

    if (
      this.userService.getPermission(
        'manager-review-your-recipe',
        this.currentUser,
      )
    ) {
      const notify: INotification = this.notifyService.buildNotification(
        'Рецепт успешно опубликован',
        `Рецепт «${this.createdRecipe.name}» успешно опубликован и теперь доступен всем кулинарам для просмотра`,
        'success',
        'recipe',
        '/recipes/list/' + this.createdRecipe.id,
      );
      subscribes.push(
        this.notifyService.sendNotification(notify, this.currentUser),
      );
    }

    const authorFollowers = this.userService.getFollowers(
      this.users,
      this.currentUser.id,
    );
    const notifyForFollower = notifyForFollowersOfApprovedRecipeAuthor(
      this.currentUser,
      this.createdRecipe,
      this.notifyService,
    );
    authorFollowers.forEach((follower) => {
      if (this.userService.getPermission('new-recipe-from-following', follower))
        subscribes.push(
          this.notifyService.sendNotification(notifyForFollower, follower),
        );
    });

    forkJoin(subscribes).subscribe();
  }

  editRecipe(): void {
    const categoriesIds: number[] = [];
    this.selectedCategories.forEach((element) => {
      categoriesIds.push(element.id);
    });

    const recipeData: IRecipe = {
      ...this.editedRecipe,
      name: this.form.value.recipeName,
      ingredients: this.form.value.ingredients,
      instructions: this.form.value.instructions,
      mainImage: this.form.value.image,
      description: this.form.value.description,
      history: this.form.value.history,
      preparationTime: this.form.value.preparationTime,
      cookingTime: this.form.value.cookingTime,
      origin: this.form.value.origin,
      nutritions: this.form.value.nutritions,
      servings: this.form.value.portions,
      categories: categoriesIds,
      publicationDate: '',
      status: this.isAwaitingApprove
        ? this.currentUser.role === 'user'
          ? 'awaits'
          : 'public'
        : 'private',
    };

    recipeData.ingredients.forEach((ingredient) => {
      const findedIngredient = recipeData.ingredients.find(
        (i) => i === ingredient,
      );
      if (findedIngredient) {
        findedIngredient.quantity = ingredient.quantity.replace(',', '.');
      }
    });
    this.updatedRecipeEmitter.emit(recipeData);
  }

  //модальные окна
  handleCreateRecipeModal(answer: boolean): void {
    if (answer) {
      this.createRecipe();
    } else {
      this.renderer.addClass(document.body, 'hide-overflow');
      (<HTMLElement>document.querySelector('.header')).style.width =
        'calc(100% - 16px)';
    }
    this.createModalShow = false;
  }
  handleEditRecipeModal(answer: boolean): void {
    if (answer) {
      this.editRecipe();
    } else {
      setTimeout(() => {
        this.renderer.addClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          'calc(100% - 16px)';
      }, 0);
    }

    this.editModalShow = false;
    this.cd.markForCheck();
  }

  handleExitModal(answer: boolean): void {
    this.exitModalShow = false;

    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      setTimeout(() => {
        this.renderer.addClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          'calc(100% - 16px)';
      }, 0);
    }
  }
  handleSuccessModal() {
    this.router.navigateByUrl('recipes/list/' + (this.recipeId - 1));

    this.cd.markForCheck();

    this.successModalShow = false;
    this.closeEmitter.emit(true);

    if (
      this.userService.getPermission('you-create-new-recipe', this.currentUser)
    ) {
      const notify: INotification = this.notifyService.buildNotification(
        this.isAwaitingApprove
          ? this.currentUser.role === 'user'
            ? 'Рецепт создан и отправлен на проверку'
            : 'Рецепт создан и опубликован'
          : 'Рецепт создан',
        `Рецепт «${this.editedRecipe.name}» успешно сохранен в ваших рецептах${
          this.isAwaitingApprove
            ? this.currentUser.role === 'user'
              ? ' и отправлен на проверку'
              : ' и опубликован'
            : ''
        }`,
        'success',
        'recipe',
        '/recipes/list/' + this.editedRecipe.id,
      );
      this.notifyService.sendNotification(notify, this.currentUser).subscribe();
    }
    if (
      this.isAwaitingApprove &&
      this.currentUser.role !== 'user' &&
      this.userService.getPermission('hide-author', this.currentUser)
    ) {
      this.sendNotificationsAfterPublishingRecipe();
    }
  }
  handleApproveModal(answer: boolean): void {
    if (answer) {
      this.isAwaitingApprove = true;

      if (this.editMode) this.editRecipe();
      else this.createRecipe();
    }
    this.approveModalShow = false;
    this.cd.markForCheck();
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
