import { CategoryService } from '../../../services/category.service';
import { ICategory, ISection, nullSection } from '../../../models/categories';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SectionService } from '../../../services/section.service';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  concatMap,
  finalize,
  forkJoin,
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
import { getFormattedDate } from 'src/tools/common';

@Component({
  templateUrl: './section-page.component.html',
  styleUrls: [
    './section-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
    trigger('height', heightAnim()),
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
    private userService: UserService,
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

    this.route.data.subscribe((data) => {
        this.getRouteData(data);
        this.getStartCategories();
      
    });

    this.getCurrentUser();
  }

  updateSectionData(name:string) {
              this.section = {...this.section, name:name};
              this.title = this.section.name;
              this.titleService.setTitle(this.section.name);
              this.cd.markForCheck();
         
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
  getDate(date: string) {
    return getFormattedDate(date);
  }
  private getCurrentUser() {
    this.subscriptions.add(
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser: IUser) => (this.currentUser = receivedUser)))
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
    let getSection$: Observable<any> = of(null);
    if (!this.popular)
      getSection$ = this.sectionService
        .getSection(this.section.id)
        .pipe(
          tap((receivedSection: ISection) => {
            this.section = receivedSection;
          }),
        );
    this.subscriptions.add(getSection$
      .pipe(
        finalize(() => {
          this.setTitle();
          this.loadMoreCategories();
        }),
      )
      .subscribe());
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
      let context = this.categoryService.getSomeCategoriesOfSection(
        this.CATEGORIES_PER_STEP,
        this.currentStep,
        this.section.id,
      );
      if (this.popular) {
        context = this.categoryService.getSomePopularCategories(
          this.CATEGORIES_PER_STEP,
          this.currentStep,
        );
      }

     this.subscriptions.add( context
        .pipe(
          tap((response: any) => {
            const length: number = response.count;
            const receivedCategories: ICategory[] = response.categories;

            this.categories = [...this.categories, ...receivedCategories];

            receivedCategories.forEach((category) => {
              if (category.image) {
                category.imageLoading = true;
                this.cd.markForCheck();
                if (category.image)
                 this.subscriptions.add( this.categoryService
                    .downloadImage(category.image)
                    .pipe(
                      takeUntil(this.destroyed$),
                      finalize(() => {
                        category.imageLoading = false;
                        this.cd.markForCheck();
                      }),
                    )
                    .subscribe((blob) => {
                      category.imageURL = URL.createObjectURL(blob);
                    }))
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
        .subscribe())
    }
  }

  private deleteSection() {
    this.loadingModal = true;

    const deleteSection$ = this.sectionService
      .deleteSection(this.section.id)
      .pipe(
        catchError(() => {
          this.throwErrorModal('Произошла ошибка при попытке удалить раздел.');
          return EMPTY;
        }),
      );

    const deleteImage$: Observable<any> = this.sectionService.deleteImage(this.section.id).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке удалить файл изображения удаляемого раздела.',
            );
            return EMPTY;
          }),
        )

    const deleteCategoriesImages$ = this.sectionService
      .getDeletedCategoriesImages(this.section.id)
      .pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке получить список категорий удаляемого раздела.',
          );
          return EMPTY;
        }),
        concatMap((categoriesIds) => {
          if (categoriesIds.length > 0) {
            return forkJoin(
              categoriesIds.map((id) => this.categoryService.deleteImage(id)),
            ).pipe(
              catchError(() => {
                this.throwErrorModal(
                  'Произошла ошибка при попытке удалить файлы изображений категорий удаляемого раздела.',
                );
                return EMPTY;
              }),
            );
          } else {
            return of(null); // Если нет изображений категорий, возвращаем пустой Observable
          }
        }),
      );

    deleteCategoriesImages$
      .pipe(
        concatMap(() => deleteImage$),
        concatMap(() => deleteSection$),
        finalize(() => {
          this.loadingModal = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successDeleteModal = true;
        },
      });
  }
  throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }
  handleErrorModal() {
    this.errorModal = false;
  }

  handleSuccessDeleteModal() {
    this.successDeleteModal = false;
    this.router.navigateByUrl('/sections');
  }
  errorModalContent = '';
  successDeleteModal = false;
  errorModal = false;

  navigateToMatchRecipes() {
    this.router.navigateByUrl('/recipes');
  }

  handleDeleteModal(answer: boolean) {
    if (answer) this.deleteSection();
    this.deleteModal = false;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.subscriptions.unsubscribe();
  }

  subscriptions = new Subscription();

  moreInfo = false;
}
