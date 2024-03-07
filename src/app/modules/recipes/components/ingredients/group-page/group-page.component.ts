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
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import {
  Observable,
  tap,
  forkJoin,
  count,
  finalize,
  catchError,
  EMPTY,
  of,
} from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

@Component({
  templateUrl: './group-page.component.html',
  styleUrls: [
    './group-page.component.scss',
    '../../../../authentication/common-styles.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [trigger('modal', modal())],
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
  ingredientsPerStep = 10;

  loadingModal = false;
  editModal = false;
  deleteModal = false;

  constructor(
    private authService: AuthService,
    private titleService: Title,
    private groupService: GroupService,
    private ingredientService: IngredientService,
    private userService:UserService,
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

  initGroup() {
    this.title = this.group.name;
    this.titleService.setTitle(this.title);
    this.checkActualIngredients();
  }

  updateGroup() {
    this.groupService.getGroup(this.group.id)
      .pipe(
        tap(
          (groups:any) => {
            this.group = groups[0];
            this.title = this.group.name;
            this.titleService.setTitle(this.title);
            this.cd.markForCheck();
          }
        )
      )
      .subscribe()
  }

  checkActualIngredients() {
    this.currentStep = 0;
    this.everythingLoaded = false;
    this.loadMoreIngredients();
  }

  getStartIngredients() {
    this.ingredientService.setIngredients([]);
    this.ingredients = [];
    this.checkActualIngredients();

  }

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
              this.currentUserId,
            )
          : this.ingredientService.getSomePopularIngredients(
              this.ingredientsPerStep,
              this.currentStep,
              this.currentUserId,
            );

      subscribe$.subscribe((response: any) => {
        setTimeout(() => {
          const newIngredients: IIngredient[] = response.results;
          const count = response.count;

          const actualIngredients = newIngredients.filter(
            (newIngredient) =>
              !this.ingredients.some(
                (existingIngredient) =>
                  existingIngredient.id === newIngredient.id,
              ),
          );
          actualIngredients.forEach((ingredient) => {
            this.ingredientService.addIngredientToIngredients(ingredient);
            this.loadIngredientImage(ingredient);
          });

          if (actualIngredients.length > 0) {
            this.ingredients = [...this.ingredients, ...actualIngredients];
            this.currentStep++;
          } else {
            this.everythingLoaded = true;
          }

          console.log(count)

          if (count <= this.ingredients.length) {
            this.everythingLoaded = true;
          }

          this.loaded = true;
          this.cd.markForCheck();
        });
      });
    }
  }

  loadIngredientImage(ingredient: IIngredient) {
    if (ingredient.image) {
      ingredient.imageLoading = true;
      this.ingredientService.updateIngredientInIngredients(ingredient);
      setTimeout(() => {
        if (ingredient.image)
          this.ingredientService
            .downloadImage(ingredient.image)
            .pipe(
              finalize(() => {
                ingredient.imageLoading = false;
                this.ingredientService.updateIngredientInIngredients(
                  ingredient,
                );
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
      }, 1000);
    }
  }

  handleDeleteModal(answer: boolean) {
    if (answer) {
      this.loadingModal = true;
      const deleteSection$ = this.groupService.deleteGroup(this.group.id);
      const deleteImage$ = this.group.image
        ? this.groupService.deleteImage(this.group.image)
        : of(null);

      forkJoin([deleteImage$, deleteSection$])
        .pipe(
          finalize(() => {
            this.router.navigateByUrl('/groups');
          }),
        )
        .subscribe();
    }
    this.deleteModal = false;
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
