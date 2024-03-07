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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import {
  IIngredient,
  IGroup,
  nullIngredient,
  nullGroup,
} from '../../../models/ingredients';
import { IngredientService } from '../../../services/ingredient.service';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { groupCreatingPlaceholder } from 'src/tools/images';
import { GroupService } from '../../../services/group.service';

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
  @Input() editedGroupId: number = 0;

  //modals
  saveModal: boolean = false;
  closeModal: boolean = false;
  loading = false;
  error = '';

  successModal: boolean = false;
  errorModal = false;

  beginningIngredients: IIngredient[] = [];

  editedGroup: IGroup = {...nullGroup};
  newGroup: IGroup = nullGroup;

  selectedIngredients: IIngredient[] = [];

  //image
  groupImage: string = '';
  defaultImage: string = groupCreatingPlaceholder;

  //form
  form: FormGroup;
  beginningData: any;

  protected destroyed$: Subject<void> = new Subject<void>();

  get edit() {
    return this.editedGroupId > 0;
  }

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private groupService: GroupService,
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

  ngOnInit() {
    addModalStyle(this.renderer);
    this.editedGroupInit();
  }

  editedGroupDataLoaded = false;

  private editedGroupInit() {
    if (this.edit) {
      this.groupService
        .getGroupForEditing(this.editedGroupId)
        .pipe(
          tap((group) => {
            let loadImage$: Observable<any> = EMPTY;

            if (group.image) {
              loadImage$ = this.groupService.downloadImage(group.image).pipe(
                tap((blob) => {
                  this.editedGroup.imageURL = URL.createObjectURL(blob);
                  this.editedGroup.image = group.image;
                  this.groupImage = this.editedGroup.imageURL || '';
                  this.form.get('image')?.setValue('url');
                }),

                catchError(() => {
                  return EMPTY;
                }),
              );
            }
            this.editedGroup.name = group.name;
            this.form.get('name')?.setValue(this.editedGroup.name);
            this.editedGroup.id = group.id;
            loadImage$
              .pipe(
                finalize(() => {

                  this.editedGroupDataLoaded = true;
                  this.beginningData = this.form.getRawValue();
                  addModalStyle(this.renderer);
                  this.cdr.markForCheck();

                }),
              )
              .subscribe();
          }),
        )
        .subscribe();
    } else {
      this.editedGroupDataLoaded = true;
    }
  }

  private handleGroupAction() {
    const ingredientsOfGroup = this.selectedIngredients.map(
      (ingredient) => ingredient.id,
    );

    this.newGroup = {
      ...nullGroup,
      name: this.form.value.name,
      image: this.form.value.image ? 'image' : undefined,
      id: this.edit ? this.editedGroup.id : 0,
      ingredients: [...ingredientsOfGroup],
    };

    this.loading = true;
    this.cdr.markForCheck();

    if (this.edit) {
      this.editGroup();
    } else {
      this.createGroup();
    }

    this.cdr.markForCheck();
  }

  private editGroup() {
    let loadImage = false;
    let deleteImage = false;
    let filename = '';


    if (this.editedGroup.image !== this.newGroup.image) {
      //если фото поменялось
      if (this.newGroup.image) {
        loadImage = true;
      }
      if (this.editedGroup.image) {
        deleteImage = true;
      }
    } else {
      //если фото не поменялось
      this.newGroup.image = this.editedGroup.image;
    }

    let loadImage$: Observable<any> = of(null);

    loadImage$ = loadImage
      ? this.groupService.uploadGroupImage(this.form.get('image')?.value).pipe(
          map((response: any) => {
             filename = response.filename;
            
          }),
        )
      : of(null);

    const deleteImage$ =
      deleteImage && this.editedGroup.image
        ? this.groupService.deleteImage(this.editedGroup.image)
        : of(null);

    const putGroup$ = this.groupService.updateGroup(this.newGroup);

    forkJoin({
      updateGroup: putGroup$,
      loadImage: loadImage$,
      deleteImage: deleteImage$,
    })
      .pipe(
        tap(() => {

          this.groupService
            .setImageToGroup(this.newGroup.id, filename)
            .pipe(
              tap(() => {
                
                this.successModal = true;
                this.cdr.markForCheck();
              }),
              catchError(
                (error) => {
                  return EMPTY;
              }
            ),
              finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
              }),
            )
            .subscribe();

     
        }),
        catchError((error) => {
          return EMPTY;
        }),
        
      )
      .subscribe();
  }

  private createGroup() {
    if (this.form.get('image')?.value) {
      this.groupService
        .uploadGroupImage(this.form.get('image')?.value)
        .subscribe((res: any) => {
          const filename = res.filename;
          this.newGroup.image = filename;
          this.postGroup();
        });
    } else {
      this.postGroup();
    }
  }

  postGroup() {
    this.groupService
      .postGroup(this.newGroup)
      .pipe(
        tap((response: any) => {
          const section: IGroup = {
            ...this.newGroup,
            id: response.id,
          };
          if (this.newGroup.ingredients.length > 0) {
            this.newGroup.ingredients.forEach((ingredientId) => {
              this.ingredientService
                .setGroupToIngredient(section.id, ingredientId)
                .subscribe();
            });
          }

          this.successModal = true;
          this.cdr.markForCheck();
        }),

        catchError((response) => {
          if (this.newGroup.image) {
            this.groupService
              .deleteImage(this.newGroup.image)
              .pipe(
                catchError(() => {
                  this.error =
                    'Произошла ошибка при попытке удалить новую фотографию незагруженной категории';
                  this.errorModal = true;
                  return EMPTY;
                }),
              )
              .subscribe();
          }
          this.error = response.error.info || '';
          this.errorModal = true;
          this.cdr.markForCheck();

          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe();
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.groupImage = this.defaultImage;
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.handleGroupAction();
    } else {
      addModalStyle(this.renderer);
    }
    this.saveModal = false;
  }

  handleSuccessModal() {
    this.successModal = false;
    this.closeEmitter.emit(true);
    this.editEmitter.emit(true);
  }

  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      addModalStyle(this.renderer);
    }
    this.closeModal = false;
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
    }
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
