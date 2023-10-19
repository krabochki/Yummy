import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { IRecipe } from '../../../models/recipes';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { RecipeService } from '../../../services/recipe.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recipe-creating',
  templateUrl: './recipe-creating.component.html',
  styleUrls: ['./recipe-creating.component.scss'],
  animations: [trigger('modal', modal())],
})
export class RecipeCreatingComponent implements OnInit {
  defaultImage: string = '../../../../../assets/images/add-main-photo.png';
  defaultInstructionImage: string =
    '../../../../../assets/images/add-photo.png';

  currentUser: IUser = nullUser;

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.ingredients.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  dropNutritions(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.nutritions.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  dropInstructions(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.instructions.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  form: FormGroup;

  createModalShow = false;
  handleCreateRecipeModal(answer: boolean) {
    if (answer) {
      this.createRecipe();
    }
    this.createModalShow = false;
  }

  exitModalShow = false;
  handleExitModal(answer: boolean) {
    if (answer) {
      this.router.navigateByUrl('recipes');
    }
    this.exitModalShow = false;
  }
  successModalShow = false;
  handleSuccessModal(answer: boolean) {
    this.router.navigateByUrl('recipes/list/' + this.recipeId);
    this.successModalShow = false;
  }
  approveModalShow = false;
  handleApproveModal(answer: boolean) {
    if (answer) {
              this.isAwaitingApprove = true;

       this.createRecipe()
     }
     this.approveModalShow = false;
  }


  isAwaitingApprove = false;
  
  recipeId = 0;


 

  constructor(
    private authService: AuthService,
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

  currentUserSubscription?: Subscription;
  ngOnInit(): void {
    this.router.events.subscribe(() => {
      window.scrollTo(0, 0);
    });
    this.currentUserSubscription = this.authService
      .getCurrentUser()
      .subscribe((data) => {
        this.currentUser = data;
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainPhotoChange(event: any) {
    const selectedFile = event.target.files[0]; // Первый выбранный файл
    const image = this.form.get('image');
    image?.setValue(selectedFile);
    if (selectedFile) {
      const objectURL = URL.createObjectURL(selectedFile);
      this.mainImage = objectURL;
    }
  }

  mainImage: string = '';

  instuctionImageChange(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    instructionIndex: number,
    imageIndex: number,
  ) {
    const file = event.target.files[0];
    if (file) {
      const instructionsArray = this.form.get('instructions') as FormArray;
      const instructionGroup = instructionsArray.at(
        instructionIndex,
      ) as FormGroup;
      const imagesArray = instructionGroup.get('images') as FormArray;
      const imageControl = imagesArray.at(imageIndex);
      imageControl?.patchValue({
        file: file,
      });

      const objectURL = URL.createObjectURL(file);
      this.images[instructionIndex][imageIndex] = objectURL;
    }
  }

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

  images: string[][] = [['']];

  //получаем url загруженного фото инструкции для вывода в background-image
  getInstructionPhotoURL(instructionIndex: number, imageIndex: number): string {
    if (this.images) {
      if (this.images[instructionIndex]) {
        if (
          this.images[instructionIndex][imageIndex] &&
          this.images[instructionIndex][imageIndex] !== ''
        ) {
          return this.images[instructionIndex][imageIndex];
        } else return this.defaultInstructionImage;
      } else return this.defaultInstructionImage;
    } else return this.defaultInstructionImage;
  }

  //--------------------

  createImageControl() {
    return this.fb.group({
      file: [null],
    });
  }

  addIngredient() {
    this.ingredients.push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ],
        ],
        amount: ['', [Validators.minLength(1)]],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  addNutrition() {
    this.nutritions.push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ],
        ],
        amount: ['', [Validators.minLength(1)]],
        unit: ['', Validators.maxLength(10)],
      }),
    );
  }

  removeNutrition(index: number) {
    this.nutritions.removeAt(index);
  }

  addInstruction() {
    this.instructions.push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
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
    this.instructions.removeAt(index);
  }

  //для удобства доступа к полям
  get ingredients() {
    return this.form.get('ingredients') as FormArray;
  }

  get nutritions() {
    return this.form.get('nutritions') as FormArray;
  }

  get instructions() {
    return this.form.get('instructions') as FormArray;
  }

  get photos() {
    return this.form.get('photos') as FormArray;
  }

  get categories() {
    return this.form.get('categories') as FormArray;
  }

  getImages(instructionIndex: number) {
    const instructionsArray = this.form.get('instructions') as FormArray;
    const instructionGroup = instructionsArray.at(
      instructionIndex,
    ) as FormGroup;
    const imagesArray = instructionGroup.get('images') as FormArray;
    return imagesArray.controls;
  }

  submitForm() {
    this.createModalShow = true;
  }

  //обработчик отправки формы
  createRecipe() {
    if (this.form.valid) {
      this.recipeService.getRecipes().subscribe((data) => {
        const recipes: IRecipe[] = data;
        const maxId = Math.max(...recipes.map((u) => u.id));
        this.recipeId = maxId;
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
          categories: [],
          cooksId: [],
          likesId: [],
          favoritesId: [],
          id: maxId + 1,
          comments: [],
          publicationDate: '',
          status: this.isAwaitingApprove ? 'awaits' : 'private',
        };
        this.recipeService.postRecipe(recipeData).subscribe(
          (response) => {
            this.successModalShow = true;
          },
          (error) => {},
        );
      });
    }
  }
}
