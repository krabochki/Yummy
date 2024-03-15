import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  IIngredient,
  IGroup,
  nullIngredient,
} from '../../../models/ingredients';
import { ActivatedRoute, Router } from '@angular/router';
import { IngredientService } from '../../../services/ingredient.service';
import { IRecipe, Nutrition } from '../../../models/recipes';
import { ICategory } from '../../../models/categories';
import { Title } from '@angular/platform-browser';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  concatMap,
  finalize,
  forkJoin,
  of,
  takeUntil,
  tap,
} from 'rxjs';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { getFormattedDate, setReadingTimeInMinutes } from 'src/tools/common';
import {
  ProductType,
  ShoppingListItem,
  nullProduct,
  productTypes,
} from 'src/app/modules/planning/models/shopping-list';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { PlanService } from 'src/app/modules/planning/services/plan.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

@Component({
  selector: 'app-ingredient-page',
  templateUrl: './ingredient-page.component.html',
  styleUrls: ['./ingredient-page.component.scss'],
  animations: [trigger('height', heightAnim()), trigger('modal', modal())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientPageComponent implements OnInit, OnDestroy {
  resolverIngredient = nullIngredient;
  ingredient: IIngredient = nullIngredient;
  shoppingGroups = productTypes;
  auth = false;
  loading = false;

  preloader = [
    'AaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaa',
    'AaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaa',
    'AaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaAaaaaaaaa',
  ];
  recipesLength = 0;

  initialLoading = true;
  currentUser: IUser = { ...nullUser };
  relatedCategories: ICategory[] = [];
  relatedIngredients: IIngredient[] = [];
  showHistory = false;
  protected destroyed$: Subject<void> = new Subject<void>();
  groups: IGroup[] = [];
  addedAlready: boolean = false;

  showedImages: string[] = [];
  startImageToView = 0;

  get shoppingGroup(): ProductType {
    return (
      this.shoppingGroups.find(
        (g) => g.id === this.ingredient.shoppingListGroup,
      ) || this.shoppingGroups[0]
    );
  }

  get nutritionWithContent() {
    return this.ingredient.nutritions?.filter(
      (nutrition) => nutrition.quantity && nutrition.unit,
    );
  }
  get nutritionsWithoutContentText() {
    if (this.ingredient.nutritions) {
      const nutritionsWithoutContent: Nutrition[] =
        this.ingredient.nutritions?.filter(
          (nutrition) => !nutrition.quantity && !nutrition.unit,
        );
      const nutritionsNames = nutritionsWithoutContent.map(
        (item: { name: string }) => item.name.toLowerCase(),
      );
      return nutritionsNames.join(', ');
    } else return '';
  }

  get variations() {
    return this.ingredient.variations.join(', ');
  }

  get showReviewSection() {
    return (
      this.ingredient.advantages?.length ||
      this.ingredient.disadvantages?.length ||
      this.ingredient.recommendedTo?.length ||
      this.ingredient.contraindicatedTo?.length
    );
  }

  get showContentBlock() {
    return (
      this.showMainSection ||
      this.showCookingSection ||
      this.showReviewSection ||
      this.ingredient.tips?.length ||
      this.ingredient.nutritions?.length ||
      this.ingredient.externalLinks?.length
    );
  }

  get showMainSection() {
    return (
      this.ingredient.description ||
      this.ingredient.history ||
      this.ingredient.origin
    );
  }

  get showCookingSection() {
    return (
      this.ingredient.precautions?.length ||
      this.ingredient.cookingMethods?.length ||
      this.ingredient.storageMethods?.length ||
      this.ingredient.compatibleDishes?.length
    );
  }

  get readingTimesInMinutes() {
    const combinedText = [
      this.ingredient.history,
      this.ingredient.description,
      this.ingredient.nutritions?.map((n) => n.name) || [],
      this.ingredient.advantages?.map((a) => a) || [],
      this.ingredient.disadvantages?.map((d) => d) || [],
      this.ingredient.compatibleDishes?.map((c) => c) || [],
      this.ingredient.contraindicatedTo?.map((c) => c) || [],
      this.ingredient.cookingMethods?.map((c) => c) || [],
      this.ingredient.precautions?.map((p) => p) || [],
      this.ingredient.recommendedTo?.map((r) => r) || [],
      this.ingredient.storageMethods?.map((s) => s) || [],
      this.ingredient.tips?.map((t) => t) || [],
    ].join(' ');
    return setReadingTimeInMinutes(combinedText);
  }

  constructor(
    private route: ActivatedRoute,
    private ingredientService: IngredientService,
    private titleService: Title,
    private userService: UserService,
    private planService: PlanService,
    private router: Router,
    private authService: AuthService,

    private cd: ChangeDetectorRef,
  ) {}

  currentUserId = 0;
  placeholder = '/assets/images/ingredient-placeholder.png';
  ngOnInit() {
    this.ingredientService.setIngredients([]);
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((receivedUser) => {
        this.auth = receivedUser.id > 0;
        this.currentUser = receivedUser;
      });

    this.route.data.subscribe((data) => {
      this.authService.getTokenUser().subscribe((receivedUser) => {
        this.currentUserId = receivedUser.id;
        this.currentUserRole = receivedUser.role;

        this.ingredientService.setIngredients([]);
        this.ingredient = nullIngredient;

        this.recipesLength = 0;
        this.relatedCategories = [];
        this.relatedIngredients = [];
        this.showHistory = false;
        this.groups = [];
        this.addedAlready = false;

        this.initialLoading = true;
        const id = data['IngredientResolver'].id;
        this.ingredient = data['IngredientResolver'];
        this.resolverIngredient = this.ingredient;
        this.titleService.setTitle(this.ingredient.name);
        this.cd.markForCheck();

        this.getIngredient(id);
      });
    });
  }

  viewImage() {
    if (this.ingredient.imageURL) {
      this.startImageToView = 0;
      this.showedImages = [this.ingredient.imageURL];
    }
  }
  getDate(date: string) {
    return getFormattedDate(date);
  }
  editModal = false;
  deleteModal = false;

  changeIngredientAfterEditing() {
    this.ingredientService.setIngredients([]);
    this.ingredient = nullIngredient;
    this.loading = false;
    this.recipesLength = 0;
    this.initialLoading = true;
    this.relatedCategories = [];
    this.relatedIngredients = [];
    this.showHistory = false;
    this.groups = [];
    this.addedAlready = false;

    this.titleService.setTitle(this.ingredient.name);
    this.ingredient = this.resolverIngredient;

    this.getIngredient(this.ingredient.id);
  }

  currentUserRole: string = 'user';

  getIngredient(id: number) {
    this.ingredientService
      .getFullIngredient(id, this.currentUserId, this.currentUserRole)
      .pipe(
        tap((ingredient: IIngredient) => {
          this.ingredient = ingredient;
          const subscribes$: Observable<any>[] = [];
          subscribes$.push(
            this.ingredientService.getGroupsOfIngredient(ingredient.id).pipe(
              tap((groups) => {
                this.groups = groups;
              }),
            ),
          );
          subscribes$.push(
            this.ingredientService.getRelatedIngredients(ingredient.id).pipe(
              tap((relatedIngredients) => {
                this.relatedIngredients = relatedIngredients;
              }),
            ),
          );
          subscribes$.push(
            this.ingredientService.getVariations(ingredient.id).pipe(
              tap((variations) => {
                this.ingredient.variations = variations || [];
              }),
            ),
          );
          subscribes$.push(
            this.ingredientService.getRelatedCategories(ingredient.id).pipe(
              tap((relatedCategories: ICategory[]) => {
                this.relatedCategories = relatedCategories;
              }),
            ),
          );
          if (this.currentUser.id > 0)
            subscribes$.push(
              this.ingredientService
                .getInfoAboutIngredientInShoppingList(
                  ingredient.id,
                  this.currentUser.id,
                )
                .pipe(
                  tap((res: any) => {
                    const isInShoppingList = res.hasRows;
                    this.addedAlready = isInShoppingList;
                  }),
                ),
            );

          forkJoin(subscribes$).subscribe(() => {
            this.initialLoading = false;

            this.cd.markForCheck();
          });

          this.downloadImage();

          this.recipesLength = ingredient.recipesCount || 0;
        }),
      )
      .subscribe();
  }

  goToSection(section: string) {
    const sectionTag = document.getElementById(section);
    if (sectionTag) {
      const headerHeight =
        document.getElementsByClassName('header')[0].clientHeight;
      window.scrollTo({
        top: sectionTag.offsetTop - headerHeight,
        behavior: 'smooth',
      });
    }
  }

  oneColumn(context: 'advantages' | 'recommendations' | 'cooking') {
    switch (context) {
      case 'advantages':
        if (this.ingredient.advantages && this.ingredient.disadvantages) {
          return (
            (this.ingredient.advantages.length > 0 &&
              this.ingredient.disadvantages.length === 0) ||
            (this.ingredient.advantages.length === 0 &&
              this.ingredient.disadvantages.length > 0)
          );
        } else return false;
      case 'recommendations':
        if (
          this.ingredient.recommendedTo &&
          this.ingredient.contraindicatedTo
        ) {
          return (
            (this.ingredient.contraindicatedTo.length > 0 &&
              this.ingredient.recommendedTo.length === 0) ||
            (this.ingredient.contraindicatedTo.length === 0 &&
              this.ingredient.recommendedTo.length > 0)
          );
        } else return false;
      case 'cooking':
        if (this.ingredient.cookingMethods && this.ingredient.storageMethods) {
          return (
            (this.ingredient.cookingMethods.length > 0 &&
              this.ingredient.storageMethods.length === 0) ||
            (this.ingredient.cookingMethods.length === 0 &&
              this.ingredient.storageMethods.length > 0)
          );
        } else return false;
    }
  }

  showIngredientButtons() {
    return this.userService.getPermission(
      this.currentUser.limitations || [],
      Permission.IngredientsManagingButtons,
    );
  }

  addParagraphs(text: string) {
    return text.replace(/\n/g, '<br>');
  }

  noListStyle(list: any[]) {
    return { 'list-style-type': list.length > 1 ? 'default' : 'none' };
  }

  downloadImage() {
    if (this.ingredient.image) {
      this.ingredient.imageLoading = true;
      this.ingredientService
        .downloadImage(this.ingredient.image!)
        .pipe(
          finalize(() => {
            this.ingredient.imageLoading = false;
            this.cd.markForCheck();
          }),
          tap((blob) => {
            if (blob) {
              this.ingredient.imageURL = URL.createObjectURL(blob);
            }
          }),
          catchError(() => {
            return EMPTY;
          }),
        )
        .subscribe();
    }
  }

  addToBasket() {
    this.loading = true;
    this.cd.markForCheck();
    if (!this.addedAlready) {
      const product: ShoppingListItem = {
        ...nullProduct,
        userId: this.currentUser.id,
        name: this.ingredient.name,
        typeId: this.ingredient.shoppingListGroup || 0,
      };
      this.planService
        .postProduct(product)
        .pipe(
          tap(() => {
            this.addedAlready = true;
          }),
          finalize(() => {
            this.loading = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    } else {
      this.ingredientService
        .deleteProductsByIngredientName(this.ingredient.id, this.currentUser.id)
        .pipe(
          tap(() => {
            this.addedAlready = false;
          }),
          finalize(() => {
            this.loading = false;
            this.cd.markForCheck();
          }),
        )
        .subscribe();
    }
  }

  showCapture() {
    return (
      !this.ingredient.image ||
      (this.ingredient.image &&
        !this.ingredient.imageLoading &&
        !this.ingredient.imageURL)
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  handleDeleteModal(answer: boolean) {
    if (answer) {
      this.deleteIngredient();
    }
    this.deleteModal = false;
  }

  deleteIngredient() {
    this.loading = true;

    const deleteIngredient$ = this.ingredientService
      .deleteIngredient(this.ingredient.id)
      .pipe(
        catchError(() => {
          this.throwErrorModal(
            'Произошла ошибка при попытке удалить ингредиент',
          );
          return EMPTY;
        }),
      );

    const deleteImage$: Observable<any> = this.ingredient.image
      ? this.ingredientService.deleteImage(this.ingredient.image).pipe(
          catchError(() => {
            this.throwErrorModal(
              'Произошла ошибка при попытке удалить файл изображения ингредиента',
            );
            return EMPTY;
          }),
        )
      : of(null);

    deleteImage$
      .pipe(
        concatMap(() => deleteIngredient$),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successDeleteModal = true;
        },
      });
  }
  moreInfo = false;
  throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }

  errorModalContent = '';
  successDeleteModal = false;
  errorModal = false;

  handleErrorModal() {
    this.errorModal = false;
  }

  handleSuccessDeleteModal() {
    this.successDeleteModal = false;
    this.router.navigateByUrl('/ingredients');
  }
}
