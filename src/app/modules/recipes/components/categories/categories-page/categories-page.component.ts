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
  Observable,
  Subject,
  catchError,
  finalize,
  forkJoin,
  takeUntil,
  tap,
} from 'rxjs';
import { IRecipe } from '../../../models/recipes';
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
  loaded = true;
  sections: ISection[] = [];
  categories: ICategory[] = [];
  creatingMode = false;
  currentUser: IUser = { ...nullUser };
  section: ISection = nullSection;
  title: string = '';
  popularCategories: ICategory[] = [];

  currentUserId = 0;

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
    this.categoryService.setCategories([]);

    this.authService.getTokenUser().subscribe((receivedUser) => {
      this.currentUserId = receivedUser.id;

      this.getCurrentUserData();
      this.getCategoriesData();
    });
  }

  updateAfterChanges() {
    this.categoryService.setCategories([]);
    this.sectionService.setSections([]);
    this.sections = [];
    this.categories = [];
    this.everythingLoaded = false;
    this.popularCategories = [];

    this.checkActualSections();
  }
  navigateToMatchRecipes() {
    this.router.navigateByUrl('/match');
  }

  getCategoriesData() {
    this.categoryService.categories$.subscribe(
      (receivedCategories: ICategory[]) => {
        this.categories = JSON.parse(JSON.stringify(receivedCategories));
        this.cd.markForCheck();
      },
    );
    this.sections = [];
    this.title = 'Категории';
    this.checkActualSections();
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
    if (this.loaded) {
      this.loaded = false;
      this.cd.markForCheck();
      this.sectionService
        .getSomeSections(this.sectionsPerStep, this.currentStep)
        .subscribe((response: any) => {
          setTimeout(() => {
            const newSections: ISection[] = response.results;
            const count = response.count;

            console.log(newSections);

            const actualSections = newSections.filter(
              (newSection) =>
                !this.sections.some(
                  (existingSection) => existingSection.id === newSection.id,
                ),
            );

            const subscribes: Observable<any>[] = [];
            const categoriesSubscribes: Observable<any>[] = [];
            let lastCategories: ICategory[] = [];

            actualSections.forEach((section) => {
              subscribes.push(
                this.sectionService.getSectionCategories(section.id).pipe(
                  tap((receivedCategoriesIds: number[]) => {
                    section.categoriesIds = receivedCategoriesIds;
                    if (section.categoriesIds && section.categoriesIds.length) {
                      categoriesSubscribes.push(
                        this.categoryService
                          .getCategoriesOfSection(
                            section.id,
                            this.currentUserId,
                          )
                          .pipe(
                            tap((categories: ICategory[]) => {
                              lastCategories = [
                                ...lastCategories,
                                ...categories,
                              ];
                              categories.forEach((category) => {
                                this.categoryService.addCategoryToCategories(
                                  category,
                                );
                              });
                            }),
                          ),
                      );
                    }
                  }),
                ),
              );
            });

            forkJoin(subscribes)
              .pipe(
                tap(() => {
                  forkJoin(categoriesSubscribes).subscribe(() => {
                    lastCategories.forEach((category) => {
                      if (category.image) {
                        category.imageLoading = true;
                        this.categoryService.updateCategoryInCategories(
                          category,
                        );
                        setTimeout(() => {
                          if (category.image)
                            this.categoryService
                              .downloadImage(category.image)
                              .pipe(
                                finalize(() => {
                                  category.imageLoading = false;
                                  this.categoryService.updateCategoryInCategories(
                                    category,
                                  );
                                }),
                                tap((blob) => {
                                  if (blob) {
                                    category.imageURL =
                                      URL.createObjectURL(blob);
                                  }
                                }),
                                catchError(() => {
                                  return EMPTY;
                                }),
                              )
                              .subscribe();
                        }, 1000);
                      }
                    });

                    if (actualSections.length > 0) {
                      this.sections = [...this.sections, ...actualSections];
                      this.currentStep++;
                    } else {
                      this.everythingLoaded = true;
                    }
                    if (count <= this.sections.length) {
                      this.everythingLoaded = true;
                    }

                    this.categoryService
                      .getPopularCategories(this.currentUser.id)
                      .pipe(
                        tap((popularCategories: ICategory[]) => {
                          this.popularCategories = popularCategories;
                          this.cd.markForCheck();
                          this.popularCategories.forEach((category) => {
                            if (category.image) {
                              category.imageLoading = true;
                              setTimeout(() => {
                                if (category.image)
                                  this.categoryService
                                    .downloadImage(category.image)
                                    .pipe(
                                      finalize(() => {
                                        category.imageLoading = false;
                                        this.cd.detectChanges();
                                      }),
                                      tap((blob) => {
                                        if (blob) {
                                          category.imageURL =
                                            URL.createObjectURL(blob);
                                          this.cd.detectChanges();
                                        }
                                      }),
                                      catchError(() => {
                                        return EMPTY;
                                      }),
                                    )
                                    .subscribe();
                              }, 1000);
                            }
                          });
                        }),
                      )
                      .subscribe();

                    this.loaded = true;
                    this.cd.markForCheck();
                  });
                }),
              )
              .subscribe();
          }, 1500);
        });
    }
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
    if (!(this.categories.length === 0 && !this.loaded))
      if (this.currentUser.id > 0) {
        this.creatingMode = true;
      } else {
        this.noAccessModalShow = true;
      }
  }

  getCurrentUserData() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
