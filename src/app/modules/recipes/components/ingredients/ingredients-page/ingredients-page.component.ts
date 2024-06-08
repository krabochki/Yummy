import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { IIngredient, IGroup } from '../../../models/ingredients';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  forkJoin,
  tap,
} from 'rxjs';
import { IngredientService } from '../../../services/ingredient.service';
import { Router } from '@angular/router';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { GroupService } from '../../../services/group.service';

@Component({
  selector: 'app-ingredients-page',
  templateUrl: './ingredients-page.component.html',
  styleUrls: [
    '../../../../authentication/common-styles.scss',
    './ingredients-page.component.scss',
  ],
  animations: [
    trigger('auto-complete', heightAnim()),
    trigger('modal', modal()),
  ],
})
export class IngredientsPageComponent implements OnInit, OnDestroy {
  groups: IGroup[] = [];
  ingredients: IIngredient[] = [];

  accessModal = false;
  createModal: boolean = false;
  title: string = '';

  initialLoading = true;

  currentUserId = 0;

  private currentStep = 0;
  loaded = true;
  popularLoaded = true;
  everythingLoaded = false;
  private groupsPerStep = 3;

  skeleton = Array.from(Array(this.groupsPerStep).keys());

  protected destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private ingredientService: IngredientService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private groupService: GroupService,
    private authService: AuthService,
    private titleService: Title,
  ) {}

  getCurrentUserData() {
    this.authService.getTokenUser().subscribe((receivedUser) => {
      this.currentUserId = receivedUser.id;
                          this.initialLoading = false;

      this.getIngredientsData();
    });
  }

  handleNoAccessModal(event: boolean) {
    if (event) {
      this.router.navigateByUrl('/greetings');
    }
    this.accessModal = false;
  }

  ngOnInit() {
    this.getCurrentUserData();
  }

  getIngredientsData() {
    this.groups = [];
    this.ingredients = [];
    this.title = 'Ингредиенты';
    this.titleService.setTitle(this.title);

    this.popularLoaded = false;

      this.getPopularIngredients().subscribe(() => {
        this.popularLoaded = true;
        this.checkActualGroups();
      });
  }

  getPopularIngredients() {
    return this.ingredientService
      .getPopularIngredients( )
      .pipe(
        tap((popularIngredients) => {
          if (popularIngredients.length > 0) {
             const actualIngredients = popularIngredients.filter(
              (ingredient) =>
                !this.ingredients.some(
                  (existingIngredient) => existingIngredient.id === ingredient.id,
                ),
             );
            
            this.ingredients = [...actualIngredients, ...this.ingredients];

            const popularIngredientsIds: number[] = popularIngredients.map(
              (ingredient) => ingredient.id,
            );
            this.groups.push({
              id: -1,
              ingredients: popularIngredientsIds,
              name: 'Популярные ингредиенты',
            });
            actualIngredients.forEach((ingredient) => {
              this.loadIngredientImage(ingredient);
            });
            this.cd.markForCheck();
          }
        }),
      );
  }

  checkActualGroups() {
    this.everythingLoaded = false;
    this.currentStep = 0;
    this.loadMoreGroups();
  }

  loadMoreGroups() {
    this.init();
    if (this.loaded) {
      this.loaded = false;
      this.cd.markForCheck();
      this.groupService
        .getSomeGroups(this.groupsPerStep, this.currentStep)
        .subscribe((response: any) => {
            const newGroups: IGroup[] = response.results;
            const count = response.count;

            const actualGroups = newGroups.filter(
              (newGroup) =>
                !this.groups.some(
                  (existingGroup) => existingGroup.id === newGroup.id,
                ),
            );

            const subscribes: Observable<any>[] = [];
            let lastIngredients: IIngredient[] = [];

            actualGroups.forEach((group) => {

              
             const groupIngredients$ =  this.ingredientService
                .getIngredientsOfGroup(group.id)
                .pipe(
                  tap((ingredients: IIngredient[]) => {
                     group.ingredients = ingredients.map(i=>i.id);
                    const newIngredients = ingredients.filter(
                      (ingredient) => {
                        return (
                          !this.ingredients.some(
                            (existingIngredient) =>
                              existingIngredient.id === ingredient.id,
                          ) &&
                          !lastIngredients.some(
                            (existingIngredient) =>
                              existingIngredient.id === ingredient.id,
                          )
                        );
                      },
                    );

                    lastIngredients = [
                      ...lastIngredients,
                      ...newIngredients,
                    ];
                  }));
                   
              subscribes.push(groupIngredients$)        
              
            });

            forkJoin(subscribes)
              .pipe(
                tap(() => {
                    lastIngredients.forEach((ingredient) => {
                      this.loadIngredientImage(ingredient);
                    });
                  this.ingredients = [...lastIngredients, ...this.ingredients];

                    if (actualGroups.length > 0) {
                      this.groups = [...this.groups, ...actualGroups];
                      this.currentStep++;
                    } else {
                      this.everythingLoaded = true;
                    }

                    const popularExist = this.groups.find((g) => g.id === -1);

                    const groupsLength = popularExist
                      ? this.groups.length - 1
                      : this.groups.length;

                    if (count <= groupsLength) {
                      this.everythingLoaded = true;
                    }

                    this.loaded = true;

                    this.cd.markForCheck();
                }),
              )
              .subscribe();
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

  init() {
    this.title = 'Ингредиенты';
    this.titleService.setTitle(this.title);
    this.cd.markForCheck();
  }

  getIngredientsOfGroup(group: IGroup): IIngredient[] {
    const groupIngredients: IIngredient[] = [];

    this.ingredients.forEach((ingredient) => {
      if (group.ingredients.includes(ingredient.id)) {
        groupIngredients.push(ingredient);
      }
    });

    return groupIngredients;
  }

  createIngredientButtonClick() {
    if (
      !this.initialLoading&&
      !(this.ingredients.length === 0 && !this.loaded) &&
      this.popularLoaded
    ) {
      if (this.currentUserId > 0) {
        this.createModal = true;
      } else {
        this.accessModal = true;
      }
    }
  }

  getIngredientsIds() {
    const ingredientsIds: number[] = [];
    this.ingredients.forEach((ingredient) => {
      ingredientsIds.push(ingredient.id);
    });
    return ingredientsIds;
  }

  navigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  updateAfterChanges() {
    this.ingredients = [];
    this.groups = [];
  }
}
