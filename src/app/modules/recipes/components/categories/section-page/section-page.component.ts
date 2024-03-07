import { CategoryService } from '../../../services/category.service';
import {
  ICategory,
  ISection,
  nullSection,
} from '../../../models/categories';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SectionService } from '../../../services/section.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal, popup } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import {
  EMPTY,
  Observable,
  Subject,
  concatMap,
  finalize,
  forkJoin,
  from,
  of,
  takeUntil,
  tap,
} from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

@Component({
  templateUrl: './section-page.component.html',
  styleUrls: [
    './section-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPageComponent implements OnInit, OnDestroy {
  everythingLoaded = false;
  loaded = false;
  categories: ICategory[] = [];

  private currentStep = 0;
  private CATEGORIES_PER_STEP = 10;

  currentUser: IUser = { ...nullUser };
  section: ISection = { ...nullSection };
  currentUserId = 0;

  title: string = 'Please, wait...';

  protected destroyed$: Subject<void> = new Subject<void>();

  deleteModal = false;
  loadingModal = false;
  successEditModal = false;
  editModal = false;
  createModal = false;

  popular = false;

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private sectionService: SectionService,
    private router: Router,
    private userService:UserService,
    private cd: ChangeDetectorRef,
    private titleService: Title,
    private authService: AuthService,
  ) {}

  ngOnInit() {
      const screenWidth = window.innerWidth;

    if (screenWidth <= 740) {
      this.CATEGORIES_PER_STEP = 4;
    } else if (screenWidth <= 960) {
      this.CATEGORIES_PER_STEP = 6;
    } else if (screenWidth <= 1400) {
      this.CATEGORIES_PER_STEP = 8;
    }


    this.authService.getTokenUser().subscribe((receivedUser) => {
      this.currentUserId = receivedUser.id;
      this.sectionService.setSections([]);
      this.route.data.subscribe((data) => {
        this.getRouteData(data);
        this.getStartCategories();
      });
    });

    this.getCurrentUser();
  }

  showSectionButtons() {
        return this.userService.getPermission(
          this.currentUser.limitations || [],
          Permission.SectionManagingButtons,
        );

  }
  
  private getRouteData(data: any) {
    if (data['filter'] === 'popular') {
      this.popular = true;
    } else {
      this.section = data['SectionResolver'];
    }
  }

  private getCurrentUser() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser));
  }

  private setTitle() {
    if (this.popular) {
      this.title = 'Популярные категории';
    } else {
      this.title = this.section.name;
    }
    this.titleService.setTitle(this.title);
  }

  getStartCategories() {
    this.categories = [];
    this.currentStep = 0;
    this.everythingLoaded = false;

    this.loaded = false;
    let getSection$: Observable<any> = EMPTY;
    if (!this.popular)
      getSection$ = this.sectionService.getSection(this.section.id).pipe(
        tap((receivedSection: ISection) => {
          this.section = receivedSection;
        }),
      );
    getSection$
      .pipe(
        finalize(() => {
          this.setTitle();
          this.loadMoreCategories();
        }),
      )
      .subscribe();
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.accessModal = false;
  }

  accessModal = false;

  createCategoryButtonClick() {
    if (!(this.categories.length === 0 && !this.loaded))
      if (this.currentUser.id > 0) {
        this.createModal = true;
      } else {
        this.accessModal = true;
      }
  }

  loadMoreCategories() {
    if (this.loaded || !this.categories.length) {
      this.loaded = false;
      setTimeout(() => {
        let context = this.categoryService.getSomeCategoriesOfSection(
          this.CATEGORIES_PER_STEP,
          this.currentStep,
          this.section.id,
          this.currentUser.id,
        );
        if (this.popular) {
          context = this.categoryService.getSomePopularCategories(
            this.CATEGORIES_PER_STEP,
            this.currentStep,
            this.currentUserId,
          );
        }

        context
          .pipe(
            tap((response: any) => {
              const length: number = response.count;
              const receivedCategories: ICategory[] = response.categories;

              this.categories = [...this.categories, ...receivedCategories];

              receivedCategories.forEach((category) => {
                if (category.image) {
                  category.imageLoading = true;
                  this.cd.markForCheck();
                  setTimeout(() => {
                    if (category.image)
                      this.categoryService
                        .downloadImage(category.image)
                        .pipe(
                          finalize(() => {
                            category.imageLoading = false;
                            this.cd.markForCheck();
                          }),
                        )
                        .subscribe((blob) => {
                          category.imageURL = URL.createObjectURL(blob);
                        });
                  }, 1000);
                }
              });

              if (length <= this.categories.length) {
                this.everythingLoaded = true;
              }
              this.currentStep++;
              this.loaded = true;
              this.cd.markForCheck();
            }),
          )
          .subscribe();
      }, 1000);
    }
  }

  private deleteSection() {
    this.loadingModal = true;

    const deleteSection$ = this.sectionService.deleteSection(this.section.id);

    const deleteImage$ = this.section.image
      ? this.sectionService.deleteImage(this.section.image)
      : of(null);

    const deleteCategoriesImages$ = this.sectionService
      .getImagesOfDeletedSectionCategories(this.section.id)
      .pipe(
        concatMap((images) => from(images)),
        concatMap((image) => this.categoryService.deleteImage(image)),
      );

    forkJoin([deleteImage$, deleteSection$, deleteCategoriesImages$])
      .pipe(
        finalize(() => {
          this.router.navigateByUrl('/sections');
        }),
      )
      .subscribe();
  }

  navigateToMatchRecipes() {
    this.router.navigateByUrl('/match');
  }

  handleDeleteModal(answer: boolean) {
    if (answer) this.deleteSection();
    this.deleteModal = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
