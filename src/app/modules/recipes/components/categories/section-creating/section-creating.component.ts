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
  ICategory,
  ISection,
  nullCategory,
  nullSection,
} from '../../../models/categories';
import { Subject, takeUntil } from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { trimmedMinLengthValidator } from 'src/tools/validators';
import { CategoryService } from '../../../services/category.service';
import {
  addModalStyle,
  baseComparator,
  removeModalStyle,
} from 'src/tools/common';

@Component({
  selector: 'app-section-creating',
  templateUrl: './section-creating.component.html',
  styleUrls: ['../../../../styles/forms.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCreatingComponent implements OnInit, OnDestroy {
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() editEmitter = new EventEmitter();
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  protected destroyed$: Subject<void> = new Subject<void>();

  //modals
  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  loading: boolean = false;

  newSection: ISection = { ...nullSection };

  selectedCategories: ICategory[] = [];

  //image
  sectionImage: string = '';
  defaultImage: string = '/assets/images/add-section.png';
  supabaseFilepath: string = '';

  //form
  form: FormGroup;
  beginningData: any;

  //initData
  @Input() editedSection: ISection = nullSection;
  categoriesWithoutSection: ICategory[] = [];
  categories: ICategory[] = [];
  categoriesNames: string[] = [];
  sections: ISection[] = [];
  beginningCategories:ICategory[]=[]

  maxId = 0;

  get edit() {
    return this.editedSection.id > 0;
  }

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private sectionService: SectionService,
    private categoryService: CategoryService,
  ) {
    this.sectionService.getMaxCategoryId().then((maxId) => {
      this.maxId = maxId;
    });
    this.form = this.fb.group({
      form: [],
      name: [
        '',
        [
          trimmedMinLengthValidator(4),
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(30),
        ],
      ],
      image: [null],
    });
    this.sectionImage = this.defaultImage;
  }

  private initCategories() {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedCategories: ICategory[]) => {
        const categories = receivedCategories.filter(
          (category) => category.status === 'public',
        );
        this.categories = categories;
        categories.forEach((category) => {
          let categoryHaveSection = false;

          this.sections.forEach((section) => {
            if (section.categories.includes(category.id)) {
              categoryHaveSection = true;
            }
          });
          if (!categoryHaveSection) {
            this.categoriesWithoutSection.push(category);
          }
        });
      });
    this.updateCategoriesWithoutSection();
  }
  private initEditedSection() {
    if (this.edit) {
      this.form.get('name')?.setValue(this.editedSection.name);
      const sectionImage = this.editedSection.photo;
      if (sectionImage) {
        this.sectionImage = this.downloadSectionImageFromSupabase(sectionImage);
        this.supabaseFilepath = sectionImage;
        this.form.get('image')?.setValue('url');
      }
      this.editedSection.categories.forEach((categoryId) => {
        const findedCategory = this.categories.find(
          (category) => category.id === categoryId,
        );
        if (findedCategory) this.selectedCategories.push(findedCategory);
      });
      this.beginningData = this.form.getRawValue();
    }
    this.beginningCategories = this.selectedCategories;
  }
  private initSections() {
    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedSections: ISection[]) => {
        this.sections = receivedSections;
      });
  }

  ngOnInit() {
    addModalStyle(this.renderer);
    this.initSections();
    this.initCategories();
    this.initEditedSection();
  }

  addCategory(event: string) {
    if (!this.selectedCategories.find((category) => category.name === event)) {
      const findedCategory: ICategory =
        this.categoriesWithoutSection.find(
          (category) => category.name === event,
        ) || nullCategory;

      this.selectedCategories.push(findedCategory);
    }
  }

  removeCategory(event: string) {
    this.selectedCategories = this.selectedCategories.filter(
      (category) => category.name !== event,
    );
    const findedCategory = this.categories.find(
      (category) => category.name === event,
    );
    if (findedCategory) {
      const findedCategoryInCategoriesWithoutSection =
        this.categoriesWithoutSection.find(
          (category) => category.name === event,
        );
      if (!findedCategoryInCategoriesWithoutSection) {
        this.categoriesWithoutSection.push(findedCategory);
        this.updateCategoriesWithoutSection();
      }
    }
  }

  updateCategoriesWithoutSection() {
    this.categoriesNames = this.categoriesWithoutSection
      .map((category) => category.name)
      .sort((a, b) => baseComparator(a, b));
  }
  onSectionImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.sectionImage = objectURL;
      this.supabaseFilepath = this.setSectionImageFilenameForSupabase();
    }
  }

  private setSectionImageFilenameForSupabase(): string {
    const file = this.form.get('image')?.value;
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}.${fileExt}`;
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.sectionImage = this.defaultImage;
    this.supabaseFilepath = '';
  }

  downloadSectionImageFromSupabase(path: string) {
    return supabase.storage.from('sections').getPublicUrl(path).data.publicUrl;
  }

  async loadSectionImageToSupabase() {
    const file = this.form.get('image')?.value;
    const filePath = this.supabaseFilepath;
    await this.sectionService.loadSectionImageToSupabase(filePath, file);
  }

  async createSection() {
    this.loading = true;
    this.cdr.markForCheck();

    if (this.edit) {
      if (this.editedSection.photo === null) {
        this.editedSection.photo = '';
      }
      if (this.editedSection.photo !== this.newSection.photo) {
        if (this.newSection.photo) {
          await this.loadSectionImageToSupabase();
        }
        if (this.editedSection.photo) {
          await this.sectionService.removeSectionImageFromSupabase(
            this.editedSection.photo,
          );
        }
      } else {
        await this.loadSectionImageToSupabase();
      }
      await this.sectionService.updateSectionInSupabase(this.newSection);
      this.editEmitter.emit();
      this.closeEmitter.emit(true);
    } else {
      if (this.form.get('image')?.value) {
        this.loadSectionImageToSupabase();
      }

      await this.sectionService.addSectionToSupabase(this.newSection);
    }
    this.loading = false;
    this.successModal = true;
    this.cdr.markForCheck();
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

  areObjectsEqual(): boolean {
    if (JSON.stringify(this.beginningCategories) !== JSON.stringify(this.selectedCategories))
      return true;
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  handleSaveModal(answer: boolean) {
    const categoriesOfSection = this.selectedCategories.map(
      (category) => category.id,
    );
    this.newSection = {
      ...nullSection,
      categories: [...categoriesOfSection],
      photo: this.form.value.image ? this.supabaseFilepath : undefined,
      name: this.form.value.name,
      id: this.edit ? this.editedSection.id : this.maxId + 1,
    };
    if (answer) {
      this.createSection();
    }
    addModalStyle(this.renderer);
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

  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
  }
}
