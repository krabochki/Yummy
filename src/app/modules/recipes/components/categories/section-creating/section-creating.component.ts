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
import { heightAnim, modal } from 'src/tools/animations';
import { CategoryService } from '../../../services/category.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ISection, nullSection } from '../../../models/categories';
import { Subject, takeUntil } from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { supabase } from 'src/app/modules/controls/image/supabase-data';
import { trimmedMinLengthValidator } from 'src/tools/validators';

@Component({
  selector: 'app-section-creating',
  templateUrl: './section-creating.component.html',
  styleUrls: ['./section-creating.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCreatingComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  @Output() closeEmitter = new EventEmitter<boolean>();

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  newSection: ISection = { ...nullSection };
  loading = false;
  myImage: string = '';
  defaultImage: string = '../../../../../assets/images/add-section.png';
  form: FormGroup;
  allSections: ISection[] = [];
  beginningData: any;
  maxId = 0;

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private sectionService: SectionService,
  ) {
    this.sectionService.getMaxCategoryId().then((maxId) => {
      this.maxId = maxId;
    });
    this.form = this.fb.group({
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
    this.myImage = this.defaultImage;
  }

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  protected destroyed$: Subject<void> = new Subject<void>();

  ngOnInit() {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    this.renderer.addClass(document.body, 'hide-overflow');

    this.sectionService.sections$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: ISection[]) => {
        this.allSections = data;
      });
  }

  onUserpicChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('image')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.myImage = objectURL;
      this.supabaseFilepath = this.setUserpicFilenameForSupabase();
    }
  }

  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  async createSection() {
   
    this.loading = true;
    this.cdr.markForCheck();

    await this.sectionService.addSectionToSupabase(this.newSection);
    this.loading = false;
    this.successModal = true;

    this.cdr.markForCheck();
  }

  handleSaveModal(answer: boolean) {
     this.newSection = {
       ...nullSection,
       photo: this.form.value.image ? this.supabaseFilepath : undefined,
       name: this.form.value.name,
       id: this.maxId + 1,
     };
    if (answer) {
      if (this.form.value.image) {
        this.loadCategorypicToSupabase();
      } else {
        this.createSection();
      }
    }
    setTimeout(() => {
      this.renderer.addClass(document.body, 'hide-overflow');
      (<HTMLElement>document.querySelector('.header')).style.width =
        'calc(100% - 16px)';
    }, 0);
    this.saveModal = false;
  }
  handleSuccessModal(answer: boolean) {
    this.closeEmitter.emit(true);
    this.successModal = false;
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      setTimeout(() => {
        this.renderer.addClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          'calc(100% - 16px)';
      }, 0);
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

  private setUserpicFilenameForSupabase(): string {
    const file = this.form.get('image')?.value;
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}.${fileExt}`;
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.myImage = this.defaultImage;
    this.supabaseFilepath = '';
  }

  supabaseFilepath = '';
  async loadCategorypicToSupabase() {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const file = this.form.get('image')?.value;
      const filePath = this.supabaseFilepath;
      await supabase.storage.from('sections').upload(filePath, file);
      await this.sectionService.addSectionToSupabase(this.newSection);
      this.successModal = true;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      this.loading = false;

      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }
}
