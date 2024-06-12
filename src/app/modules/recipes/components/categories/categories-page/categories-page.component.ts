import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CategoryService } from '../../../services/category.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { Router } from '@angular/router';
import { SectionService } from '../../../services/section.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import {
  EMPTY,
  Subject,
  Subscription,
  catchError,
  finalize,
  forkJoin,
  of,
  takeUntil,
  tap,
} from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  templateUrl: './categories-page.component.html',
  styleUrls: [
    './categories-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  private currentStep = 0;
  private sectionsPerStep = 3;

  skeleton = Array.from(Array(this.sectionsPerStep).keys());

  everythingLoaded = false;
  loaded = false;
  sections: ISection[] = [];
  categories: ICategory[] = [];
  creatingMode = false;
  currentUser: IUser = { ...nullUser };
  section: ISection = nullSection;
  title: string = 'Категории';
  popularCategories: ICategory[] = [];
  subsriptions: Subscription = new Subscription();



  protected destroyed$: Subject<void> = new Subject<void>();

  noAccessModalShow = false;
  successEditModal = false;

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private sectionService: SectionService,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private authService: AuthService,
  ) {}

  ngOnInit() {
        this.getCurrentUserData();
        this.getCategoriesData();
  }

  
  navigateToMatchRecipes() {
    this.router.navigateByUrl('/match');
  }

  getCategoriesData() {
    this.sections = [];
    this.categories = [];
    

    this.subsriptions.add(this.getPopularCategories()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.checkActualSections();
      }));
    this.titleService.setTitle(this.title);
    this.cd.markForCheck();
  }

  checkActualSections() {
    this.currentStep = 0;
    this.loadMoreSections();
  }

  getCategoriesOfSection(section: ISection): ICategory[] {
    const sectionCategories: ICategory[] = [];

    this.categories.forEach((category) => {
      if (section.categoriesIds.includes(category.id)) {
        sectionCategories.push(category);
      }
    });

    return sectionCategories;
  }

  loadMoreSections() {
    if (this.loaded || !this.sections.length) {
      this.loaded = false;
      this.subsriptions.add(this.sectionService
        .getSomeSections(this.sectionsPerStep, this.currentStep)
        .pipe(takeUntil(this.destroyed$))
        .subscribe((response: any) => {
          const newSections: ISection[] = response.results;
          const count = response.count;
          const actualSections = newSections.filter(
            (newSection) =>
              !this.sections.some(
                (existingSection) => existingSection.id === newSection.id,
              ),
          );

          let categoriesSubscribes: any = [];
          let lastCategories: ICategory[] = [];

          actualSections.forEach((section) => {
            categoriesSubscribes.push(
              this.categoryService.getCategoriesOfSection(section.id).pipe(
                tap((categories: ICategory[]) => {
                  section.categoriesIds = categories.map((c) => c.id);

                  const actualCategories = categories.filter(
                    (category) =>
                      !lastCategories.some(
                        (existingCategory) =>
                          existingCategory.id === category.id,
                      ),
                  );

                  lastCategories = [...actualCategories, ...lastCategories];
                }),
              ),
            );
          });

          categoriesSubscribes = categoriesSubscribes.length
            ? categoriesSubscribes
            : of(null);

          forkJoin(categoriesSubscribes)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(() => {
              const actualCategories = lastCategories.filter(
                (category) =>
                  !this.categories.some(
                    (existingCategory) => existingCategory.id === category.id,
                  ),
              );

              actualCategories.forEach((category) => {
                this.loadCategoryImage(category);
              });

              this.categories = [...actualCategories, ...this.categories];

              if (actualSections.length > 0) {
                this.sections = [...this.sections, ...actualSections];
                this.currentStep++;
              } else {
                this.everythingLoaded = true;
              }
              if (count <= this.sections.length) {
                this.everythingLoaded = true;
              }

              this.loaded = true;

              this.cd.markForCheck();
            });
        }));
    }
  }

  loadCategoryImage(category: ICategory) {
    if (category.image) {
      category.imageLoading = true;
      if (category.image)
      this.subsriptions.add(  this.categoryService
          .downloadImage(category.image)
          .pipe(
            takeUntil(this.destroyed$),
            finalize(() => {
              category.imageLoading = false;
              this.cd.markForCheck();
            }),
            tap((blob) => {
              if (blob) {
                category.imageURL = URL.createObjectURL(blob);
              }
            }),
            catchError(() => {
              return EMPTY;
            }),
          )
          .subscribe())
    }
  }

  getPopularCategories() {
    return this.categoryService.getPopularCategories().pipe(
      tap((popularCategories: ICategory[]) => {
        this.popularCategories = popularCategories;
        this.cd.markForCheck();
        this.popularCategories.forEach((category) => {
          this.loadCategoryImage(category);
        });
      }),
    );
  }

  pIndex(id: number) {
    return this.popularCategories.findIndex((category) => category.id === id);
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.noAccessModalShow = false;
  }

  createCategoryButtonClick() {
      if (this.currentUser.id > 0) {
        this.creatingMode = true;
      } else {
        this.noAccessModalShow = true;
      }
  }

  getCurrentUserData() {
    this.subsriptions.add(this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser)));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subsriptions.unsubscribe();
  }
}
