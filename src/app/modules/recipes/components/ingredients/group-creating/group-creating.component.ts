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
  concatMap,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  IIngredient,
  IGroup,
  nullIngredient,
  nullGroup,
} from '../../../models/ingredients';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import { groupCreatingPlaceholder } from 'src/tools/images';
import { GroupService } from '../../../services/group.service';
import { checkFile } from 'src/tools/error.handler';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IngredientService } from '../../../services/ingredient.service';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { INotification, nullNotification } from 'src/app/modules/user-pages/models/notifications';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';

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

  currentUser: IUser = { ...nullUser };

  //modals
  saveModal: boolean = false;
  closeModal: boolean = false;
  loading = false;
  error = '';

  successModal: boolean = false;
  errorModal = false;

  errorModalContent = '';

  beginningIngredients: IIngredient[] = [];

  editedGroup: IGroup = { ...nullGroup };
  savedGroup: IGroup = { ...nullGroup };

  selectedIngredients: IIngredient[] = [];

  //image
  groupImage: string = '';
  defaultImage: string = groupCreatingPlaceholder;

  //form
  form: FormGroup;
  beginningData: any;

  initialLoading = true;

  protected destroyed$: Subject<void> = new Subject<void>();

  get edit() {
    return this.editedGroupId > 0;
  }

  constructor(
    private renderer: Renderer2,
    private userService: UserService,
    private notifyService: NotificationService,
    private cdr: ChangeDetectorRef,
    private groupService: GroupService,
    private authService: AuthService,
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
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

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
                  this.form.get('image')?.setValue('existing_photo');
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
                  this.initialLoading = false;
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
      this.initialLoading = false;
    }
  }

  saveGroup() {
    this.loading = true;
    if (this.edit) {
      this.editGroup();
    } else {
      this.createGroup();
    }
  }

  private editGroup() {
    const id = this.editedGroup.id;
    const name = this.form.value.name;
    const updatedGroup: IGroup = {
      ...nullGroup,
      id: id,
      name: name,
      image: this.getImageOfSavedGroup(),
    };
    this.PUTGroup(updatedGroup);
  }

  private PUTGroup(group: IGroup) {
    let loadImage = false;
    let deleteImage = false;

    const image = this.form.value.image;

        if (image === null) {
          deleteImage = true;
        } else if (image !== 'existing_photo') {
          loadImage = true;
          deleteImage = true;
        }


    const file: File = this.form.value.image;

    const putCategory$ = this.groupService
      .updateGroup(group)
      .pipe(
        catchError((response: any) => {
          if (response.error.info == 'NAME_EXISTS') {
            this.throwErrorModal(
              'Группа с таким названием уже существует. Измените название и попробуйте снова.',
            );
          } else {
            this.throwErrorModal(
              'Произошла ошибка при попытке обновить группу.',
            );
          }
          return EMPTY;
        }),
      );

    const loadImage$ = loadImage
      ? this.groupService.uploadGroupImage(file).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке загрузить файл нового изображения группы.',
            );
            return EMPTY;
          }),
          concatMap((response: any) => {
            const filename = response.filename;
            return this.groupService.setImageToGroup(group.id, filename).pipe(
              catchError(() => {
                this.throwErrorModal(
                  'Произошла ошибка при попытке связать новое загруженное изображение и группу.',
                );
                return EMPTY;
              }),
            );
          }),
        )
      : of(null);

    const deleteImage$ = deleteImage
      ? this.groupService.deleteImage(group.id).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке удалить старое изображение группы.',
            );
            return EMPTY;
          }),
          concatMap(() => {
            return this.groupService.setImageToGroup(group.id, '').pipe(
              catchError(() => {
                this.throwErrorModal(
                  'Произошла ошибка при попытке удаления связи старого изображения с группой.',
                );
                return EMPTY;
              }),
            );
          }),
        )
      : of(null);

    putCategory$
      .pipe(
        concatMap(() => deleteImage$),
        concatMap(() => loadImage$),
      )
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.savedGroup = group;
          this.successModal = true;
          this.cdr.markForCheck();
        },
      });
  }

  private throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
    this.cdr.markForCheck();
  }

  handleErrorModal() {
    this.errorModal = false;
    addModalStyle(this.renderer);
  }

  private POSTGroup(group: IGroup) {
    const file: File = this.form.value.image;
    this.savedGroup = group;

    this.groupService
      .postGroup(group)
      .pipe(
        concatMap((response: any) => {
          const insertedId = response.id;
          const ingredients$ = group.ingredients.length
            ? group.ingredients.map((ingredientId) =>
                this.ingredientService
                  .setGroupToIngredient(insertedId, ingredientId)
                  .pipe(
                    catchError(() => {
                      this.throwErrorModal(
                        'Произошла ошибка при попытке связать ингредиент и группу ингредиентов.',
                      );
                      return EMPTY;
                    }),
                  ),
              )
            : of(null);
          return forkJoin(ingredients$).pipe(
            map(() => response), // Возвращаем результат postGroup после завершения forkJoin
          );
        }),
        concatMap((response: any) => {
          const insertedId = response.id;
          this.savedGroup.id = insertedId;
          if (file) {
            return this.groupService.uploadGroupImage(file).pipe(
              catchError(() => {
                this.throwErrorModal(
                  'Произошла ошибка при попытке загрузить изображение группы.',
                );
                return EMPTY;
              }),
              switchMap((uploadResponse: any) => {
                const filename = uploadResponse.filename;
                return this.groupService
                  .setImageToGroup(insertedId, filename)
                  .pipe(
                    catchError(() => {
                      this.throwErrorModal(
                        'Произошла ошибка при попытке связать загруженное изображение и группу.',
                      );
                      return EMPTY;
                    }),
                  );
              }),
            );
          } else {
            return of(null);
          }
        }),
        catchError((response: any) => {
          if (response.error.info == 'NAME_EXISTS') {
            this.throwErrorModal(
              'Группа с таким названием уже существует. Измените название и попробуйте снова.',
            );
          } else {
            this.throwErrorModal(
              'Произошла ошибка при попытке создать группу.',
            );
          }
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        tap(() => {
          this.successModal = true;
        }),
      )
      .subscribe();
  }

  private createGroup() {
    const ingredients = this.selectedIngredients.map(
      (ingredient) => ingredient.id,
    );

    const name = this.form.value.name;
    const createdGroup: IGroup = {
      ...nullGroup,
      name: name,
      ingredients: ingredients,
    };
    this.POSTGroup(createdGroup);
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.saveGroup();
    } else {
      addModalStyle(this.renderer);
    }
    this.saveModal = false;
  }

  handleSuccessModal() {
    this.successModal = false;
    this.closeEmitter.emit(true);
    this.editEmitter.emit(true);

    if (this.currentUser.id) {
      if (
        this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.WorkNotifies,
        )
      ) {
        let notify: INotification = nullNotification;
        if (this.edit) {
          notify = this.notifyService.buildNotification(
            'Раздел изменен',
            `Вы успешно изменили группу ингредиентов «${this.savedGroup.name}»`,
            'success',
            'ingredient',
            `/groups/list/${this.savedGroup.id}`,
          );
        } else {
          notify = this.notifyService.buildNotification(
            'Раздел создан',
            `Вы успешно создали новую группу ингредиентов «${this.savedGroup.name}»`,
            'success',
            'ingredient',
            `/groups/list/${this.savedGroup.id}`,
          );
        }
        this.notifyService
          .sendNotification(notify, this.currentUser.id, true)
          .subscribe();
      }
    }
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
    if (file && checkFile(file)) {
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

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.groupImage = this.defaultImage;
  }

  getImageOfSavedGroup() {
    let image = '';
    const selectedImage = this.form.get('image')?.value;
    if (this.editedGroup.image && selectedImage === 'existing_photo') {
      image = this.editedGroup.image;
    } else {
      if (selectedImage) {
        image = 'image';
      }
    }
    return image;
  }
}
