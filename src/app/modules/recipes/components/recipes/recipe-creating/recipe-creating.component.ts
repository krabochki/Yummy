import {
  AfterContentChecked,
  AfterContentInit,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-recipe-creating',
  templateUrl: './recipe-creating.component.html',
  styleUrls: ['./recipe-creating.component.scss'],
})
export class RecipeCreatingComponent {


  defaultImage: string = '../../../../../assets/images/add-main-photo.png';
  defaultInstructionImage: string =
    '../../../../../assets/images/add-photo.png';

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.ingredients.controls,
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

  constructor(
    private fb: FormBuilder,
  ) {
    this.mainImage = this.defaultImage;
    this.form = this.fb.group({
      recipeName: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(40),
        ],
      ],
      description: ['', [Validators.maxLength(200)]],
      preparationTime: ['', [Validators.maxLength(200)]],
      portions: [1],
      origin: ['', [Validators.maxLength(50)]],
      ingredients: this.fb.array([]),
      instructions: this.fb.array([]),
      categories: this.fb.array([]),
      image: [null], // Это поле для загрузки картинки
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainPhotoChange(event: any) {
    const selectedFile = event.target.files[0]; // Первый выбранный файл
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
    imageIndex: number) {
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
  }

  //получаем url загруженного фото инструкции для вывода в background-image
  getInstructionPhotoURL(instructionIndex: number, imageIndex: number): string {
    const instructionsArray = this.form.get('instructions') as FormArray;
    const instructionGroup = instructionsArray.at(
      instructionIndex,
    ) as FormGroup;
    const imagesArray = instructionGroup.get('images') as FormArray;
    const imageControl = Object.assign(
      {},
      imagesArray.at(imageIndex).get('file'),
    );
    const value = imageControl?.value;
    if (value && (value instanceof Blob || value instanceof File)) {
      const objectURL = URL.createObjectURL(value);
      return objectURL;
    }

    return this.defaultInstructionImage;
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
            Validators.minLength(5),
            Validators.maxLength(50),
          ],
        ],
        amount: [1],
        unit: [''],
      }),
    );
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
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

  //обработчик отправки формы
  submitForm() {
    if (this.form.valid) {
      console.log(this.form.value);
    } else {
      // сообщение об ошибках
    }
  }
}
