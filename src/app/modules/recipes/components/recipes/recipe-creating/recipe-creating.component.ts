/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { IRecipe } from '../../../models/recipes';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ICategory, ISection } from '../../../models/categories';
import { CategoryService } from '../../../services/category.service';
import { Observable, Subject } from 'rxjs';
import { startWith, map, takeUntil } from 'rxjs/operators';
import { SectionService } from '../../../services/section.service';

export interface SectionGroup {
  section: string;
  categories: string[];
}

export const _filter = (opt: string[], value: string): string[] => {
  const filterValue = value.toLowerCase();

  return opt.filter((item) => item.toLowerCase().includes(filterValue));
};

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

  
  defaultImage: string = '../../../../../assets/images/add-main-photo.png';
  defaultInstructionImage: string =
    '../../../../../assets/images/add-photo.png';
  mainImage: string = '';

  currentUser: IUser = { ...nullUser };

  form: FormGroup;

  isAwaitingApprove = false;
  recipeId = 0;

  successModalShow = false;
  approveModalShow = false;
  exitModalShow = false;
  createModalShow = false;
  sectionGroupOptions?: Observable<SectionGroup[]>;
  images: string[][] = [['']];
  category: string = '';
  sectionGroups: SectionGroup[] = [];
  allSections: ISection[] = [];
  allCategories: ICategory[] = [];
  selectedCategories: ICategory[] = [];
  protected destroyed$: Subject<void> = new Subject<void>();

  f(field: string): FormArray {
    return this.form.get(field) as FormArray;
  }

  constructor(
    private cd: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
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
          Validators.minLength(5),
          Validators.maxLength(100),
        ],
      ],

      description: ['', Validators.maxLength(5000)],
      history: ['', [Validators.maxLength(5000)]],
      preparationTime: ['', [Validators.maxLength(200)]],
      cookingTime: ['', [Validators.maxLength(200)]],
      portions: [1],
      origin: ['', [Validators.maxLength(50)]],
      nutritions: this.fb.array([]),

      ingredients: this.fb.array([]),
      instructions: this.fb.array([]),
      categories: this.fb.array([]),
      image: [null], // Это поле для загрузки картинки
    });
  }

  ngOnInit(): void {
    this.sectionGroupOptions = this.sectionForm
      .get('sectionGroup')
      ?.valueChanges.pipe(
        startWith(''),
        map((value) => this._filterGroup(value || '')),
      );

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
                  section: '',
                  categories: [],
                };
                sectionGroup.section = section.name;
                section.categoriesId.forEach((element) => {
                  const finded = this.allCategories.find(
                    (elem) => elem.id === element,
                  );
                  if (finded) sectionGroup.categories.push(finded.name);
                });
                this.sectionGroups.push(sectionGroup);
              }
            });
          });
      });
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
  addCategory() {
    if (this.sectionForm.value.sectionGroup) {
      const findCategory: ICategory | undefined = this.allCategories.find(
        (item) => {
          if (item.name === this.sectionForm.value.sectionGroup) return true;
          else return false;
        },
      );
      if (findCategory) {
        if (!this.selectedCategories.includes(findCategory))
          this.selectedCategories.push(findCategory);
      }
    }
    this.input?.nativeElement.blur();
    this.category = '';
  }

  removeCategory(category: ICategory) {
    const x = this.selectedCategories.findIndex(
      (element) => element.id === category.id,
    );

    if (x !== -1) {
      this.selectedCategories.splice(x, 1);
    }
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
      imageControl?.patchValue({
        file: formData,
      });

      const objectURL = URL.createObjectURL(file);
      this.images[instructionIndex][imageIndex] = objectURL;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainPhotoChange(event: any) {
    const selectedFile = event.target.files[0]; // Первый выбранный файл
    const image = this.form.get('image');
    const formData = new FormData();
    formData.append('mainPhotoURL', selectedFile);

    image?.setValue(formData);
    if (selectedFile) {
      const objectURL = URL.createObjectURL(selectedFile);
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
            Validators.maxLength(100),
          ],
        ],
        quantity: ['', [Validators.minLength(1)]],
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
            Validators.maxLength(100),
          ],
        ],
        quantity: ['', [Validators.minLength(1)]],
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

  getImages(instructionIndex: number):AbstractControl<any,any>[] {
    const instructionsArray = this.f('instructions');
    const instructionGroup = instructionsArray.at(
      instructionIndex,
    ) as FormGroup;
    const imagesArray = instructionGroup.get('images') as FormArray;
    return imagesArray.controls;
  }

  submitForm(): void {
    this.createModalShow = true;
  }

  //обработчик отправки формы
  createRecipe(): void {
    const categoriesIds: number[] = [];
    this.selectedCategories.forEach((element) => {
      categoriesIds.push(element.id);
    });
    if (this.form.valid) {
      this.recipeService.recipes$
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data) => {
          const recipes: IRecipe[] = data;
          const maxId = Math.max(...recipes.map((u) => u.id));
          this.recipeId = maxId + 1;
          const recipeData: IRecipe = {
            name: this.form.value.recipeName,
            ingredients: this.form.value.ingredients,
            instructions: this.form.value.instructions,
            mainPhotoUrl: this.form.value.image,
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
          this.recipeService
            .postRecipe(recipeData)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(() => {
              this.successModalShow = true;
              this.cd.markForCheck();
            });
        });
    }
  }

  //autocomplete material
  sectionForm = this._formBuilder.group({
    sectionGroup: '',
  });

  private _filterGroup(value: string): SectionGroup[] {
    if (value) {
      return this.sectionGroups
        .map((group) => ({
          section: group.section,
          categories: _filter(group.categories, value),
        }))
        .filter((group) => group.categories.length > 0);
    }

    return this.sectionGroups;
  }

  //модальные окна
  handleCreateRecipeModal(answer: boolean): void {
    if (answer) {
      this.createRecipe();
    }
    this.createModalShow = false;
  }

  handleExitModal(answer: boolean): void {
    if (answer) {
      this.router.navigateByUrl('recipes');
    }
    this.exitModalShow = false;
  }
  handleSuccessModal() {
    this.router.navigateByUrl('/recipes/list/' + this.recipeId);
    this.successModalShow = false;
  }
  handleApproveModal(answer: boolean): void {
    if (answer) {
      this.isAwaitingApprove = true;

      this.createRecipe();
    }
    this.approveModalShow = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
