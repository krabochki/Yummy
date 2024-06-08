import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { IGroup, IIngredient, nullGroup } from '../../../models/ingredients';
import { GroupService } from '../../../services/group.service';
import { IngredientService } from '../../../services/ingredient.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  tap,
  finalize,
  catchError,
  EMPTY,
  of,
  Observable,
  concatMap,
} from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { UserService } from 'src/app/modules/user-pages/services/user.service';
import { getFormattedDate } from 'src/tools/common';

@Component({
  templateUrl: './group-page.component.html',
  styleUrls: [
    './group-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal()),trigger('height', heightAnim())],
})
export class GroupPageComponent implements OnInit {
  title: string = '';

  createModal = false;
  group: IGroup = nullGroup;
  ingredients: IIngredient[] = [];

  currentUser: IUser = nullUser;

  currentUserId = 0;
  everythingLoaded = false;
  currentStep = 0;
  loaded = true;

  moreInfo = false;

  initialLoading = true;

  ingredientsPerStep = 10;

  loadingModal = false;
  editModal = false;
  deleteModal = false;

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private groupService: GroupService,
    private ingredientService: IngredientService,
    private userService: UserService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router,
  ) {}

  navigateToMatchRecipes() {
    this.router.navigateByUrl('/match');
  }

  ngOnInit() {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 740) {
      this.ingredientsPerStep = 4;
    } else if (screenWidth <= 960) {
      this.ingredientsPerStep = 6;
    } else if (screenWidth <= 1400) {
      this.ingredientsPerStep = 8;
    }

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.route.data.subscribe((data) => {
      const context = data['filter'];

      this.authService.getTokenUser().subscribe((receivedUser) => {
        this.currentUserId = receivedUser.id;
        this.currentUserRole = receivedUser.role;
        if (context !== 'popular') {
          this.group = data['GroupResolver'];
          this.initGroup();
        } else {
          this.initPopularGroup();
        }
      });
    });
  }

  showGroupsButtons() {
    return this.userService.getPermission(
      this.currentUser.limitations || [],
      Permission.GroupsManagingButtons,
    );
  }

  getDate(date: string) {
    return getFormattedDate(date);
  }

  initGroup() {
    let getGroup$: Observable<any> = of(null);
    if (this.group.id)
      getGroup$ = this.groupService
        .getGroup(this.group.id)
        .pipe(
          tap((groups: IGroup[]) => {
            this.group = groups[0];
            this.title = this.group.name;
            this.titleService.setTitle(this.title);
          }),
        );
    getGroup$
      .pipe(
        finalize(() => {
          this.checkActualIngredients();
        }),
      )
      .subscribe();
  }

  updateGroup() {
    this.groupService
      .getGroup(this.group.id)
      .pipe(
        tap((groups: any) => {
          this.group = groups[0];
          this.title = this.group.name;
          this.titleService.setTitle(this.title);
          this.cd.markForCheck();
        }),
      )
      .subscribe();
  }

  checkActualIngredients() {
    this.currentStep = 0;
    this.everythingLoaded = false;
    this.loadMoreIngredients();
  }

  currentUserRole: string = 'user';

  loadMoreIngredients() {
    if (this.loaded) {
      this.loaded = false;
      this.cd.markForCheck();

      const subscribe$ =
        this.group.id > 0
          ? this.groupService.getSomeIngredientsOfGroup(
              this.ingredientsPerStep,
              this.currentStep,
              this.group.id,
            )
          : this.ingredientService.getSomePopularIngredients(
              this.ingredientsPerStep,
              this.currentStep,
            );

      subscribe$.subscribe((response: any) => {
        const newIngredients: IIngredient[] = response.results;
        const count = response.count;

        const actualIngredients = newIngredients.filter(
          (newIngredient) =>
            !this.ingredients.some(
              (existingIngredient) =>
                existingIngredient.id === newIngredient.id,
            ),
        );

        if (actualIngredients.length > 0) {
          this.ingredients = [...this.ingredients, ...actualIngredients];
          this.currentStep++;
          actualIngredients.forEach((ingredient) => {
            this.loadIngredientImage(ingredient);
          });
        } else {
          this.everythingLoaded = true;
        }

        if (count <= this.ingredients.length) {
          this.everythingLoaded = true;
        }

        this.loaded = true;        this.initialLoading = false;

        this.cd.markForCheck();
      });
    }
  }

  loadIngredientImage(ingredient: IIngredient) {
    if (ingredient.image) {
      ingredient.imageLoading = true;
        if (ingredient.image)
          this.ingredientService
            .downloadImage(ingredient.image)
            .pipe(
              finalize(() => {
                ingredient.imageLoading = false;

                this.cd.markForCheck();
              }),
              tap((blob) => {
                if (blob) {
                  ingredient.imageURL = URL.createObjectURL(blob);
                }
              }),
              catchError(() => {
                return EMPTY;
              }),
            )
            .subscribe();
    }
  }

  throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }
  handleErrorModal() {
    this.errorModal = false;
  }

  errorModal = false;
  errorModalContent = '';

  private deleteGroup() {
    this.loadingModal = true;

    const deleteGroup$ = this.groupService.deleteGroup(this.group.id).pipe(
      catchError(() => {
        this.throwErrorModal('Произошла ошибка при попытке удалить группу.');
        return EMPTY;
      }),
    );

    const deleteImage$: Observable<any> = this.groupService.deleteImage(this.group.id).pipe(
      catchError(() => {
        this.throwErrorModal(
          'Произошла ошибка при попытке удалить файл изображения удаляемой группы.',
        );
        return EMPTY;
      }),
    );

    deleteImage$
      .pipe(
        concatMap(() => deleteGroup$),
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

  handleDeleteModal(answer: boolean) {
    if (answer) {
      this.deleteGroup();
    }
    this.deleteModal = false;
  }

  successDeleteModal = false;

  handleSuccessDeleteModal() {
    this.successDeleteModal = false;
    this.router.navigateByUrl('/groups');
  }

  initPopularGroup() {
    this.title = 'Популярные ингредиенты';
    this.titleService.setTitle(this.title);
    this.group.name = this.title;
    this.group.id = -1;
    this.cd.markForCheck();

    this.checkActualIngredients();
  }
}
