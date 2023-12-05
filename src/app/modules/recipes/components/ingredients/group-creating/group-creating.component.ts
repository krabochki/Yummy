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
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
  nullIngredientsGroup,
} from '../../../models/ingredients';
import { IngredientService } from '../../../services/ingredient.service';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { addModalStyle, removeModalStyle } from 'src/tools/common';

@Component({
  selector: 'app-group-creating',
  templateUrl: './group-creating.component.html',
  styleUrls: ['../../../../styles/forms.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupCreatingComponent implements OnInit, OnDestroy {
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() editEmitter = new EventEmitter();
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  maxId = 0;

  //modals
  saveModal: boolean = false;
  closeModal: boolean = false;
  loading = false;
  supabaseFilepath = '';

  successModal: boolean = false;

  //init
  ingredients: IIngredient[] = [];
  beginningIngredients: IIngredient[] = [];
  @Input() editedGroup: IIngredientsGroup = nullIngredientsGroup;

  newGroup: IIngredientsGroup = { ...nullIngredientsGroup };

  selectedIngredients: IIngredient[] = [];

  //image
  groupImage: string = '';
  defaultImage: string = '/assets/images/add-group.png';

  //form
  form: FormGroup;
  beginningData: any;

  protected destroyed$: Subject<void> = new Subject<void>();

  get edit() {
    return this.editedGroup.id > 0;
  }

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private ingredientService: IngredientService,
  ) {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(30),
          trimmedMinLengthValidator(4),
        ],
      ],
      image: [null],
    });
    this.groupImage = this.defaultImage;
    this.beginningData = this.form.getRawValue();
  }

  private editedGroupInit() {
    if (this.edit) {
      this.form.get('name')?.setValue(this.editedGroup.name);
      const groupImage = this.editedGroup.image;
      if (groupImage) {
        this.groupImage = this.downloadGroupImageFromSupabase(groupImage);
        this.supabaseFilepath = groupImage;
        this.form.get('image')?.setValue('url');
      }
      this.editedGroup.ingredients.forEach((ingredientId) => {
        const findedCategory = this.ingredients.find(
          (ingredient) => ingredient.id === ingredientId,
        );
        if (findedCategory) this.selectedIngredients.push(findedCategory);
      });
      this.beginningData = this.form.getRawValue();
    }
    this.beginningIngredients = this.selectedIngredients;
  }

  downloadGroupImageFromSupabase(path: string) {
    return supabase.storage.from('groups').getPublicUrl(path).data.publicUrl;
  }

  private ingredientsInit() {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedIngredients: IIngredient[]) =>
          (this.ingredients = receivedIngredients.filter(
            (i) => i.status === 'public',
          )),
      );
  }

  ngOnInit() {
    addModalStyle(this.renderer);
    this.ingredientsInit();
    this.editedGroupInit();
  }

  addIngredient(event: IIngredient) {
    const findedIngredient: IIngredient =
      this.selectedIngredients.find(
        (ingredient) => ingredient.id === event.id,
      ) || nullIngredient;
    if (findedIngredient.id === 0) this.selectedIngredients.push(event);
  }

  removeIngredient(event: IIngredient) {
    this.selectedIngredients = this.selectedIngredients.filter(
      (ingredient) => ingredient.id !== event.id,
    );
  }

  onIngredientImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file: File | undefined = input.files?.[0];

    if (file) {
      this.form.get('image')?.setValue(file);
      const objectURL = URL.createObjectURL(file);
      this.groupImage = objectURL;
      this.supabaseFilepath = this.setGroupPictureFilenameForSupabase();
    }
  }

  async loadGroupImageToSupabase() {
    const file = this.form.get('image')?.value;
    const filePath = this.supabaseFilepath;
    await this.ingredientService.loadGroupImageToSupabase(filePath, file);
  }

  async createGroup() {
    const ingredientsOfGroup = this.selectedIngredients.map(
      (ingredient) => ingredient.id,
    );

    this.newGroup = {
      ...nullIngredientsGroup,
      name: this.form.value.name,
      image: this.form.value.image ? this.supabaseFilepath : undefined,
      id: this.edit ? this.editedGroup.id : this.maxId + 1,
      ingredients: [...ingredientsOfGroup],
    };
    this.loading = true;
    this.cdr.markForCheck();

    if (this.edit) {
      if (this.editedGroup.image === null) {
        this.editedGroup.image = '';
      }
      if (this.editedGroup.image !== this.newGroup.image) {
        if (this.newGroup.image) {
          await this.loadGroupImageToSupabase();
        }
        if (this.editedGroup.image) {
          await this.ingredientService.removeGroupImageFromSupabase(
            this.editedGroup.image,
          );
        }
      } else {
        await this.loadGroupImageToSupabase();
      }
      await this.ingredientService.updateGroupInSupabase(this.newGroup);
      this.editEmitter.emit();
      this.closeEmitter.emit(true);
    } else {
      if (this.form.get('image')?.value) {
        this.loadGroupImageToSupabase();
      }

      await this.ingredientService.addGroupToSupabase(this.newGroup);
    }
    this.loading = false;
    this.successModal = true;

    this.cdr.markForCheck();
  }
  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.groupImage = this.defaultImage;
    this.supabaseFilepath = '';
  }

  loadSectionPicture() {
    const file = this.form.get('image')?.value;
    const filePath = this.supabaseFilepath;
    return supabase.storage.from('groups').upload(filePath, file);
  }

  private setGroupPictureFilenameForSupabase(): string {
    const file = this.form.get('image')?.value;
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}.${fileExt}`;
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.createGroup();
    } else {
      addModalStyle(this.renderer);
    }
    this.saveModal = false;
  }
  handleSuccessModal() {
    this.closeEmitter.emit(true);
    this.successModal = false;
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      addModalStyle(this.renderer);
    }
    this.closeModal = false;
  }

  closeEditModal() {
    if (this.areObjectsEqual()) {
      this.closeModal = true;
    } else {
      this.closeEmitter.emit(true);
    }
  }

  areObjectsEqual(): boolean {
    if (
      JSON.stringify(this.beginningIngredients) !==
      JSON.stringify(this.selectedIngredients)
    )
      return true;
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEditModal();
  }
  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
  }
}
