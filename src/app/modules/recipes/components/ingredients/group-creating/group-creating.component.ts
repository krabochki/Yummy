import {
  AfterContentChecked,
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
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ISection, nullSection } from '../../../models/categories';
import { Subject, takeUntil } from 'rxjs';
import { SectionService } from '../../../services/section.service';
import {
  IIngredient,
  IIngredientsGroup,
  nullIngredient,
  nullIngredientsGroup,
} from '../../../models/ingredients';
import { IngredientService } from '../../../services/ingredient.service';

@Component({
  selector: 'app-group-creating',
  templateUrl: './group-creating.component.html',
  styleUrls: ['./group-creating.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupCreatingComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  @Output() closeEmitter = new EventEmitter<boolean>();

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  newGroup: IIngredientsGroup = { ...nullIngredientsGroup };

  selectedIngredients: IIngredient[] = [];
  myImage: string = '';
  defaultImage: string = '../../../../../assets/images/add-group.png';
  form: FormGroup;
  allGroups: IIngredientsGroup[] = [];
  beginningData: any;
  allIngredients: IIngredient[] = [];

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  protected destroyed$: Subject<void> = new Subject<void>();

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
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
        ],
      ],
      image: [null],
    });
    this.myImage = this.defaultImage;
    this.beginningData = this.form.getRawValue();
  }

  ngOnInit() {
    this.addModalStyle();
    this.ingredientService.ingredientsGroups$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedGroups: IIngredientsGroup[]) => {
        this.allGroups = receivedGroups;
      });
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (receivedIngredientS: IIngredient[]) =>
          (this.allIngredients = receivedIngredientS),
      );
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

  onUserpicChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.myImage = objectURL;
    }
  }

  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  private createGroup() {
    const userpicData = new FormData();
    userpicData.append('image', this.form.get('image')?.value);
    const maxId = Math.max(...this.allGroups.map((u) => u.id));
    const ingredientsOfGroup = this.selectedIngredients.map(
      (ingredient) => ingredient.id,
    );
    
    this.newGroup = {
      ...nullIngredientsGroup,
      name: this.form.value.name,
      image: userpicData,
      id: maxId + 1,
      ingredients: [...ingredientsOfGroup],
    };

    this.ingredientService.postGroup(this.newGroup).subscribe(() => {
      this.successModal = true;
    });
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.createGroup();
      this.successModal = true;
    } else {
      this.addModalStyle();
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
      this.addModalStyle();
    }
    this.closeModal = false;
  }

  closeEditModal() {
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEditModal();
  }
  addModalStyle() {
    setTimeout(() => {
      this.renderer.addClass(document.body, 'hide-overflow');
      (<HTMLElement>document.querySelector('.header')).style.width =
        'calc(100% - 16px)';
    }, 0);
  }
  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }
}
