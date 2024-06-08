import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subject, takeUntil, finalize, tap, catchError, EMPTY } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { SectionService } from '../../../services/section.service';
import { ISection } from '../../../models/categories';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';

@Component({
  templateUrl: './sections-page.component.html',
  styleUrl: './sections-page.component.scss',
  animations: [trigger('modal', modal())],
})
export class SectionsPageComponent implements OnInit {
  loaded = true;
  everythingLoaded = false;
  sections: ISection[] = [];
  currentUserId = 0;
  currentUser: IUser = nullUser;
  step = 0;
  sectionsPerStep = 10;

  initialLoading = true;

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private sectionService: SectionService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 700) {
      this.sectionsPerStep = 4;
    } else if (screenWidth <= 960) {
      this.sectionsPerStep = 6;
    } else if (screenWidth <= 1400) {
      this.sectionsPerStep = 8;
    }

    this.getCurrentUserData();
    this.titleService.setTitle('Разделы категорий');
  }

  getCurrentUserData() {
    this.authService.getTokenUser().subscribe((receivedUser) => {
      this.currentUserId = receivedUser.id;            this.initialLoading = false;

      this.getSectionsData();
    });
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => {
        this.currentUser = receivedUser;
      });
  }

  getSectionsData() {
    this.sections = [];
    this.everythingLoaded = false;

    this.step = 0;
    this.loadMoreSections();
  }

  updateAfterChanges() {
    this.getSectionsData();
  }

  loadMoreSections() {
    if (this.loaded) {
      this.loaded = false;
        this.cd.markForCheck();
        this.sectionService
          .getSomeFullSections(
            this.sectionsPerStep,
            this.step,
          )
          .subscribe((res: any) => {
            const newSections: ISection[] = res.results;
            const count = res.count;

            const actualSections = newSections.filter(
              (newSection) =>
                !this.sections.some(
                  (existingSection) => existingSection.id === newSection.id,
                ),
            );

            if (actualSections.length > 0) {
              this.sections = [...this.sections, ...actualSections];
              this.step++;
            } else {
              this.everythingLoaded = true;
            }

            actualSections.forEach((section) => {
              this.loadSectionImage(section);
            });

            if (count <= this.sections.length) {
              this.everythingLoaded = true;
            }

            this.loaded = true;

            this.cd.markForCheck();
          });
    }
  }

  loadSectionImage(section: ISection) {
    if (section.image) {
      section.imageLoading = true;
        if (section.image)
          this.sectionService
            .downloadImage(section.image)
            .pipe(
              finalize(() => {
                section.imageLoading = false;
                this.cd.markForCheck();
              }),
              tap((blob) => {
                if (blob) {
                  section.imageURL = URL.createObjectURL(blob);
                }
              }),
              catchError(() => {
                return EMPTY;
              }),
            )
            .subscribe();
    }
  }

  createModal = false;
  accessModal = false;

  createButtonClick() {
    if (!(this.sections.length === 0 && !this.loaded) && (!this.initialLoading)) {
      if (this.currentUser.id > 0) {
        this.createModal = true;
      }
    }
  }
}
