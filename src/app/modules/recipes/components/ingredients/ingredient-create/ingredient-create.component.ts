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
import {
  steps,
  Step,
  getInputPlaceholderOfControlGroup,
  getNameOfControlGroup,
} from './consts';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  customLinkPatternValidator,
  trimmedMinLengthValidator,
} from 'src/tools/validators';
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
import { getCurrentDate } from 'src/tools/common';
import { supabase } from 'src/app/modules/controls/image/supabase-data';

@Component({
  selector: 'app-ingredient-create',
  templateUrl: './ingredient-create.component.html',
  styleUrls: ['../../../../styles/forms.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientCreateComponent implements OnInit, OnDestroy {
  @ViewChild('input', { static: false }) input: ElementRef | undefined;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;
  @Output() closeEmitter = new EventEmitter<boolean>();

  form: FormGroup;

  currentUser: IUser = nullUser;
  groups: IIngredientsGroup[] = [];
  productTypes = productTypes;

  createdIngredient: IIngredient = nullIngredient;

  currentStep: number = 0;
  showInfo = false;
  steps: Step[] = steps;
  stepControlGroups = [
    ['advantages', 'disadvantages', 'recommendations', 'contraindicates'],
    ['cookingMethods', 'compatibleDishes', 'precautions'],
    ['tips', 'storageMethods'],
  ];

  @Input() editedIngredient: IIngredient = nullIngredient;
  @Output() editEmitter = new EventEmitter();
  selectedIngredientsGroups: IIngredientsGroup[] = [];

  autocompleteTypes: ProductType[] = [];
  selectedType: ProductType = productTypes[0];

  loading = false;
  supabaseFilepath = '';
  searchQuery: string = '';
  autocompleteShow: boolean = false;
  focused: boolean = false;

  createModalShow: boolean = false;
  successModalShow: boolean = false;
  exitModalShow: boolean = false;

  defaultImage: string = '/assets/images/add-ingredient.png';
  mainImage: string = '';

  protected destroyed$: Subject<void> = new Subject<void>();
  maxId = 0;
  beginningData: any;

  startGroups: number[] = [];

  get edit() {
    return this.editedIngredient.id > 0;
  }

  get validForm() {
    return (
      this.form.valid &&
      this.areObjectsEqual() &&
      this.selectedIngredientsGroups.length > 0
    );
  }

  get isManager() {
    return this.currentUser.role !== 'user';
  }

  constructor(
    private renderer: Renderer2,
    private ingredientService: IngredientService,
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    public router: Router,
    private cd: ChangeDetectorRef,
  ) {
    this.mainImage = this.defaultImage;
    this.ingredientService.getMaxIngredientId().then((maxId) => {
      this.maxId = maxId;
    });
    this.form = this.fb.group({
      ingredientName: [
        '',
        [
          trimmedMinLengthValidator(3),
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
      image: [null],
    });
  }

  ngOnInit(): void {
    this.addModalStyle();
    this.currentUserInit();
    this.ingredientsGroupsInit();
    this.editedIngredientInit();
    this.beginningData = this.form.getRawValue();
  }
  downloadMainpicFromSupabase(path: string) {
    this.mainImage = supabase.storage
      .from('ingredients')
      .getPublicUrl(path).data.publicUrl;
  }

  editedIngredientInit() {
    if (this.editedIngredient.id !== 0) {
      // sources: this.fb.array([]),
      this.form.get('ingredientName')?.setValue(this.editedIngredient.name);
      this.form.get('description')?.setValue(this.editedIngredient.description);
      this.form.get('history')?.setValue(this.editedIngredient.history);
      this.form.get('origin')?.setValue(this.editedIngredient.origin);
      this.editedIngredient.contraindicatedTo?.forEach((element) => {
        this.addBaseTextControl('contraindicates', element);
      });
      this.editedIngredient.precautions?.forEach((element) => {
        this.addBaseTextControl('precautions', element);
      });
      this.editedIngredient.compatibleDishes?.forEach((element) => {
        this.addBaseTextControl('compatibleDishes', element);
      });
      this.editedIngredient.cookingMethods?.forEach((element) => {
        this.addBaseTextControl('cookingMethods', element);
      });
      this.editedIngredient.tips?.forEach((element) => {
        this.addBaseTextControl('tips', element);
      });
      this.editedIngredient.storageMethods?.forEach((element) => {
        this.addBaseTextControl('storageMethods', element);
      });
      this.editedIngredient.advantages?.forEach((element) => {
        this.addBaseTextControl('advantages', element);
      });
      this.editedIngredient.disadvantages?.forEach((element) => {
        this.addBaseTextControl('disadvantages', element);
      });
      this.editedIngredient.variations?.forEach((element) => {
        this.addBaseTextControl('variations', element);
      });
      this.editedIngredient.recommendedTo?.forEach((element) => {
        this.addBaseTextControl('recommendations', element);
      });
      if (this.editedIngredient.image) {
        this.supabaseFilepath = this.editedIngredient.image;
        this.form.get('image')?.setValue('url');
        this.downloadMainpicFromSupabase(this.editedIngredient.image);
      }

      if (this.editedIngredient.nutritions) {
        for (let i = 1; i <= this.editedIngredient.nutritions.length; i++) {
          this.addNutrition();
          const nutritionsArray = this.form.get('nutritions') as FormArray;
          const nutritionGroup = nutritionsArray.at(i - 1) as FormGroup;
          const nutritionName = nutritionGroup.get('name') as FormControl;
          const nutritionQuantity = nutritionGroup.get(
            'quantity',
          ) as FormControl;
          const nutritionUnit = nutritionGroup.get('unit') as FormControl;
          nutritionName?.setValue(this.editedIngredient.nutritions[i - 1].name);
          nutritionQuantity?.setValue(
            this.editedIngredient.nutritions[i - 1].quantity,
          );
          nutritionUnit?.setValue(this.editedIngredient.nutritions[i - 1].unit);
        }
      }

      this.groups.forEach((group) => {
        if (group.ingredients.includes(this.editedIngredient.id)) {
          this.startGroups.push(group.id);
          this.selectedIngredientsGroups.push(group);
        }
      });

      if (this.editedIngredient.shoppingListGroup) {
        const findedGroup = this.productTypes.find(
          (t) => t.id === this.editedIngredient.shoppingListGroup,
        );
        this.selectedType = findedGroup || this.productTypes[0];
        this.searchQuery = this.selectedType.name;
        this.form.get('search')?.setValue(this.selectedType.name);
      }
      if (this.editedIngredient.externalLinks) {
        for (let i = 1; i <= this.editedIngredient.externalLinks.length; i++) {
          this.addSource();
          const sourcesArray = this.form.get('sources') as FormArray;
          const sourcesGroup = sourcesArray.at(i - 1) as FormGroup;
          const sourceName = sourcesGroup.get('name') as FormControl;
          const sourceLink = sourcesGroup.get('link') as FormControl;
          sourceName?.setValue(this.editedIngredient.externalLinks[i - 1].name);
          sourceLink?.setValue(this.editedIngredient.externalLinks[i - 1].link);
        }
      }
    }
  }

  isControlValid(control: AbstractControl, field: string) {
    return (
      control.get(field)?.invalid &&
      (control.get(field)?.dirty || control.get(field)?.touched)
    );
  }

  closeIngredientCreating(): void {
    if (
      !this.areObjectsEqual() &&
      this.selectedIngredientsGroups.length === 0
    ) {
      this.closeEmitter.emit();
    } else {
      this.exitModalShow = true;
    }
  }

  f(field: string): FormArray {
    return this.form.get(field) as FormArray;
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
      (group) => group.id !== event.id,
    );
  }

  mainPhotoChange(event: any) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.mainImage = objectURL;
      this.supabaseFilepath = this.setUserpicFilenameForSupabase();
    }
  }

  addNutrition() {
    this.f('nutritions').push(
      this.fb.group({
        name: [
          '',
          [
            Validators.required,
            trimmedMinLengthValidator(2),
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
            trimmedMinLengthValidator(2),
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        link: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            trimmedMinLengthValidator(5),
            Validators.maxLength(1000),
          ],
          customLinkPatternValidator(anySiteMask),
        ],
      }),
    );
  }

  addBaseTextControl(controlGroup: string, value?: string) {
    let maxLength = 500;
    if (controlGroup === 'variations') maxLength = 50;
    this.f(controlGroup).push(
      this.fb.group({
        content: [
          value || '',
          [
            Validators.required,
            Validators.minLength(3),
            trimmedMinLengthValidator(3),
            Validators.maxLength(maxLength),
          ],
        ],
      }),
    );
  }

  removeBaseTextControl(index: number, controlGroup: string) {
    this.f(controlGroup).removeAt(index);
  }

  submitForm(): void {
    this.createModalShow = true;
  }

  createIngredient(): void {
    const externalLinks: ExternalLink[] = [];
    this.f('sources').controls.forEach((control) => {
      const externalLink: ExternalLink = {
        link: control.get('link')?.value,
        name: control.get('name')?.value,
      };
      externalLinks.push(externalLink);
    });

    if (this.form.valid && this.selectedIngredientsGroups.length > 0) {
      this.createdIngredient = {
        id: this.edit ? this.editedIngredient.id : this.maxId + 1,
        name: this.form.value.ingredientName,
        history: this.form.value.history,
        description: this.form.value.description,
        author: this.edit ? this.editedIngredient.author : this.currentUser.id,
        sendDate: this.edit ? this.editedIngredient.sendDate : getCurrentDate(),
        variations: this.form.value.variations.map(
          (item: { content: string }) => item.content,
        ),
        status: this.edit ? 'public' : this.isManager ? 'public' : 'awaits',
        image: this.form.value.image ? this.supabaseFilepath : '',
        advantages: this.form.value.advantages.map(
          (item: { content: string }) => item.content,
        ),
        disadvantages: this.form.value.disadvantages.map(
          (item: { content: string }) => item.content,
        ),
        recommendedTo: this.form.value.recommendations.map(
          (item: { content: string }) => item.content,
        ),
        contraindicatedTo: this.form.value.contraindicates.map(
          (item: { content: string }) => item.content,
        ),
        origin: this.form.value.origin,
        precautions: this.form.value.precautions.map(
          (item: { content: string }) => item.content,
        ),
        compatibleDishes: this.form.value.compatibleDishes.map(
          (item: { content: string }) => item.content,
        ),
        cookingMethods: this.form.value.cookingMethods.map(
          (item: { content: string }) => item.content,
        ),
        tips: this.form.value.tips.map(
          (item: { content: string }) => item.content,
        ),
        nutritions: this.form.value.nutritions,
        storageMethods: this.form.value.storageMethods.map(
          (item: { content: string }) => item.content,
        ),
        externalLinks: externalLinks,
        shoppingListGroup: this.selectedType.id,
      };

      if (this.edit) {
        this.editIngredientInSupabase();
      } else {
        this.loadIngredientToSupabase();
      }

      this.selectedIngredientsGroups.forEach((group) => {
        if (!group.ingredients.includes(this.editedIngredient.id)) {
          group.ingredients.push(this.createdIngredient.id);
          this.updateGroup(group);
        }
      });
      if (this.edit)
        this.groups.forEach((group) => {
          if (
            this.startGroups.includes(group.id) &&
            !this.selectedIngredientsGroups.find((g) => g.id === group.id)
          ) {
            group.ingredients = group.ingredients.filter(
              (i) => i !== this.editedIngredient.id,
            );
            this.updateGroup(group);
          }
        });
    }
  }

  async updateGroup(group: IIngredientsGroup) {
    await this.ingredientService.updateGroupInSupabase(group);
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
        return 'Название ингредиента обязательно, а также он должен содержать как минимум 1 группу ингредиентов';
      case 1:
        break;
      case 2:
        return 'Содержание всех добавленных полей обязательно должны содержать минимум 3 символа';
      case 3:
        return 'Содержание всех добавленных полей обязательно должны содержать минимум 3 символа';

      case 4:
        return 'Название каждого нутриента должно содержать не менее 2 символов';
      case 5:
        return 'Название ссылки и сама ссылка на источник обязательны, а также ссылка должна быть корректной ссылкой на веб-сайт в интернете.';
    }
    return '';
  }

  validNextSteps(): number {
    for (let s = 0; s <= 6; s++) {
      switch (s) {
        case 0:
          if (
            !(
              this.form.get('ingredientName')!.valid &&
              this.form.get('history')!.valid &&
              this.form.get('description')!.valid &&
              this.form.get('variations')!.valid &&
              this.form.get('origin')!.valid &&
              this.selectedIngredientsGroups.length > 0
            )
          ) {
            return 1;
          }
          break;
        case 1:
          if (
            !(
              this.form.get('recommendations')!.valid &&
              this.form.get('contraindicates')!.valid &&
              this.form.get('advantages')!.valid &&
              this.form.get('disadvantages')!.valid
            )
          ) {
            return 2;
          }
          break;
        case 2:
          if (
            !(
              this.form.get('precautions')!.valid &&
              this.form.get('compatibleDishes')!.valid &&
              this.form.get('cookingMethods')!.valid
            )
          ) {
            return 3;
          }
          break;
        case 3:
          if (
            !(
              this.form.get('tips')!.valid &&
              this.form.get('storageMethods')!.valid
            )
          ) {
            return 4;
          }
          break;
        case 4:
          if (!this.form.get('nutritions')!.valid) {
            return 5;
          }
          break;
        case 5:
          if (!this.form.get('sources')!.valid) {
            return 6;
          }
          break;
      }
    }
    return 0;
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.mainImage = this.defaultImage;
    this.supabaseFilepath = '';
  }


  private setUserpicFilenameForSupabase(): string {
    const file = this.form.get('image')?.value;
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}.${fileExt}`;
  }
  async deleteOldIngredientPic(path: string) {
    await supabase.storage.from('ingredients').remove([path]);
  }
  async editIngredientInSupabase() {
    this.loading = true;
    try {

      

      if (this.editedIngredient.image !== this.createdIngredient.image) {
        if (this.createdIngredient.image) {
           await this.loadIngredientToSupabase();
        }
        if (this.editedIngredient.image)
          await this.deleteOldIngredientPic(this.editedIngredient.image);
      }

      await this.ingredientService.updateIngredientInSupabase(
        this.createdIngredient,
      );
            this.editEmitter.emit();

            this.closeEmitter.emit();

    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      this.loading = false;
      this.cd.markForCheck();
    
    }
  }

  async loadIngredientToSupabase() {
    this.loading = true;
    try {
      if (this.form.get('image')?.value) {
        const file = this.form.get('image')?.value;
        const filePath = this.supabaseFilepath;
        await supabase.storage.from('ingredients').upload(filePath, file);
      }
      
      await this.ingredientService.addIngredientToSupabase(
        this.createdIngredient,
      );
      this.successModalShow = true;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      this.loading = false;
      this.cd.markForCheck();
    }
  }

  async sendNotifyAfterCreatingIngredient() {
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

        await this.notificationService.sendNotification(
          notification,
          this.currentUser,
        );
        this.router.navigateByUrl(createdIngredientLink);
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
        await this.notificationService.sendNotification(
          notification,
          this.currentUser,
        );
      }
    }
  }

  getNameOfControlGroup(controlGroup: string): string {
    return getNameOfControlGroup(controlGroup);
  }

  getInputPlaceholderOfControlGroup(controlGroup: string): string {
    return getInputPlaceholderOfControlGroup(controlGroup);
  }

  addModalStyle() {
    setTimeout(() => {
      this.renderer.addClass(document.body, 'hide-overflow');
      (<HTMLElement>document.querySelector('.header')).style.width =
        'calc(100% - 16px)';
    }, 0);
  }

  //модальные окна

  handleExitModal(answer: boolean): void {
    this.exitModalShow = false;

    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      this.addModalStyle();
    }
  }
  handleCreateModal(answer: boolean) {
    if (answer) {
      this.createIngredient();
    } else {
      this.addModalStyle();
    }
    this.createModalShow = false;
  }
  handleSuccessModal() {
    this.successModalShow = false;
    this.closeEmitter.emit();
    this.sendNotifyAfterCreatingIngredient();
  }

  //поиск типа ингредиента
  protected blur(): void {
    if (this.searchQuery !== '' && this.searchQuery !== this.selectedType.name)
      this.searchQuery = '';

    this.autocompleteShow = false;
    this.focused = false;
  }
  protected focus(): void {
    this.autocompleteShow = true;
    this.search();
  }
  protected chooseRecipe(type: ProductType): void {
    this.searchQuery = type.name;
    this.selectedType = type;
  }
  protected search(): void {
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

  //шаги

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

  //drag drop
  drop(context: string, event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.f(context).controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  areObjectsEqual(): boolean {
    if (this.edit)
      if (this.editedIngredient.shoppingListGroup !== this.selectedType.id) return true;
      if(this.editedIngredient.image)
      if (this.form.get('image')?.value !== 'url') return true;
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

  currentUserInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser));
  }

  ingredientsGroupsInit(): void {
    this.ingredientService.ingredientsGroups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedIngredientsGroups: IIngredientsGroup[]) =>
          (this.groups = receivedIngredientsGroups.filter((g) => g.id !== 0)),
      );
  }
}
