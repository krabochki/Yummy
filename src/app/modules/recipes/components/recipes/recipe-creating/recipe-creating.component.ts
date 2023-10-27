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
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { IRecipe, nullRecipe } from '../../../models/recipes';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import { Observable, Subject } from 'rxjs';
import { startWith, map, takeUntil, max } from 'rxjs/operators';
import { SectionService } from '../../../services/section.service';
import { SectionGroup } from 'src/app/modules/controls/autocomplete/autocomplete.component';

@Component({
  selector: 'app-recipe-creating',
  templateUrl: './recipe-creating.component.html',
  styleUrls: ['./recipe-creating.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCreatingComponent implements OnInit, OnDestroy {
  @ViewChild('input', { static: false })
  input: ElementRef | undefined;

  @Output() closeEmitter = new EventEmitter<boolean>();

  defaultImage: string = '../../../../../assets/images/add-main-photo.png';
  defaultInstructionImage: string =
    '../../../../../assets/images/add-photo.png';
  mainImage: string = '';

  currentUser: IUser = { ...nullUser };

  form: FormGroup;

  isAwaitingApprove = false;

  @Input() editedRecipe: IRecipe = { ...nullRecipe };
  recipeId = 0;

  successModalShow = false;
  approveModalShow = false;
  exitModalShow = false;
  editModalShow = false;
  createModalShow = false;
  images: string[][] = [['']];
  category: string = '';
  allSections: ISection[] = [];
  allCategories: ICategory[] = [];
  selectedCategories: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();
  beginningData: any;

  editMode: boolean = false;
  f(field: string): FormArray {
    return this.form.get(field) as FormArray;
  }

  constructor(
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private categoryService: CategoryService,
    private sectionService: SectionService,
    private recipeService: RecipeService,
    private fb: FormBuilder,
    public router: Router,
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

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((currentUser: IUser) => {
        {
          this.currentUser = currentUser;
        }
      });

    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ICategory[]) => {
        this.allCategories = data;

        this.sectionService.sections$
          .pipe(takeUntil(this.destroyed$))
          .subscribe((data: ISection[]) => {
            this.allSections = data;

            this.allSections.forEach((section) => {
              if (section.categoriesId.length > 0) {
                const sectionGroup: SectionGroup = {
                  section: nullSection,
                  categories: [],
                };
                sectionGroup.section = section;
                section.categoriesId.forEach((element: number) => {
                  const finded = this.allCategories.find(
                    (elem) => elem.id === element,
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
        } catch (error) {}
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
          } catch (error) {}
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
  group: SectionGroup[] = [];
  fullGroup: SectionGroup[] = [];

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
    const findedCategory: ICategory | undefined = this.selectedCategories.find(
      (category) => category.id === event.id,
    );
    if (findedCategory === undefined) {
      this.selectedCategories.push(event);
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
        quantity: ['', Validators.maxLength(6)],
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
        quantity: ['', [Validators.maxLength(6)]],
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
        publicationDate: '',
        status: this.isAwaitingApprove ? 'awaits' : 'private',
      };

      this.recipeService.postRecipe(recipeData).subscribe(() => {
        this.successModalShow = true;
        this.cd.markForCheck();
      });
    }
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
        status: this.isAwaitingApprove ? 'awaits' : 'private',
      };

      this.recipeService.updateRecipe(recipeData).subscribe(
      
        () => {
          console.log('before modal')
          this.successModalShow = true;
          this.cd.markForCheck()
                    console.log('after modal');


      },
     
      );
    
  }

  //модальные окна
  handleCreateRecipeModal(answer: boolean): void {
    if (answer) {
      this.createRecipe();
    }
    this.createModalShow = false;
  }
  handleEditRecipeModal(answer: boolean): void {
    if (answer) {
      this.editRecipe();
    }
    this.editModalShow = false;
  }

  handleExitModal(answer: boolean): void {
    if (answer) {
      this.closeEmitter.emit(true);
    }
    this.exitModalShow = false;
  }
  handleSuccessModal() {
    if (this.editMode)
      this.router.navigateByUrl('recipes/list/' + this.editedRecipe.id);
    else this.router.navigateByUrl('recipes/list/' + (this.recipeId - 1));
    this.cd.markForCheck();

    this.successModalShow = false;
    this.closeEmitter.emit(true);
  }
  handleApproveModal(answer: boolean): void {
    if (answer) {
      this.isAwaitingApprove = true;

      if (this.editMode) this.editRecipe();
      else this.createRecipe();
    }
    this.approveModalShow = false;
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
