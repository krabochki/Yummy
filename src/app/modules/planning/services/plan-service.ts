import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { IPlan, nullPlan } from '../models/plan';
import { HttpClient } from '@angular/common/http';
import { plansUrl } from 'src/tools/source';
import { IUser } from '../../user-pages/models/users';
import { IRecipe } from '../../recipes/models/recipes';
import { NotificationService } from '../../user-pages/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  private url = plansUrl;

  planSubject = new BehaviorSubject<IPlan[]>([]);
  plans$ = this.planSubject.asObservable();

  loadPlanData() {
    this.getPlans().subscribe((data) => {
      this.planSubject.next(data);
    });
  }

  updatePlan(plan: IPlan) {
    return this.http.put<IPlan>(`${this.url}/${plan.id}`, plan).pipe(
      tap((updatedPlan: IPlan) => {
        const currentPlans = this.planSubject.value;
        const index = currentPlans.findIndex((r) => r.id === updatedPlan.id);
        if (index !== -1) {
          const updatedPlans = [...currentPlans];
          updatedPlans[index] = updatedPlan;
          this.planSubject.next(updatedPlans);
        }
      }),
    );
  }

  addPlan(plan: IPlan) {
    return this.http.post<IPlan>(this.url, plan).pipe(
      tap((newPlan: IPlan) => {
        const currentPlans = this.planSubject.value;
        const updatedPlans = [...currentPlans, newPlan];
        this.planSubject.next(updatedPlans);
      }),
    );
  }

  getPlanByUser(id: number, plans: IPlan[]) {
    const find = plans.find((p) => p.user === id);
    return find ? find : nullPlan;
  }

  getPlans() {
    return this.http.get<IPlan[]>(this.url);
  }

  updatePlansAfterDeletingRecipe(
    plans: IPlan[],
    users: IUser[],
    deletingRecipe: IRecipe,
  ) {
    const author = users.find((u) => u.id === deletingRecipe.authorId);

    plans.forEach((plan) => {
      //изменение календаря
      const user = users.find((u) => u.id === plan.user);
      if (user) {
        let anyChangesInEvents = false;
        plan.calendarEvents.forEach((calendarEvent) => {
          if (calendarEvent.recipe === deletingRecipe.id) {
            calendarEvent.recipe = 0;
            anyChangesInEvents = true;
          }
        });
        //изменение списка продуктов
        let anyChangesInShoppingList = false;
        plan.shoppingList.forEach((shoppingListItem) => {
          if (shoppingListItem.relatedRecipe === deletingRecipe.id) {
            shoppingListItem.relatedRecipe = 0;
            anyChangesInShoppingList = true;
          }
        });
        if (anyChangesInShoppingList || anyChangesInEvents) {
          //обновляем план и уведомляем что рецепт был удален и ссылка на него больше не работает
          this.updatePlan(plan).subscribe();

          const notify = this.notifyService.buildNotification(
            'Связанный рецепт удален',
            user.id !== author?.id
              ? `Обратите внимание: рецепт «${deletingRecipe.name}» автора ${
                  author?.fullName ? author.fullName : '@' + author?.username
                } был удален. Все ссылки на этот рецепт удалены из календаря рецептов и списка покупок. Сами запланированные рецепты и продукты в списке покупок не удалены`
              : `Обратите внимание: ваш рецепт «${deletingRecipe.name}» был удален. Все ссылки на этот рецепт удалены из ваших календаря рецептов и списка покупок. Сами запланированные рецепты и продукты в списке покупок не удалены`,
            'warning',
            'recipe',
            '',
          );

          this.notifyService.sendNotification(notify, user).subscribe();
        }
      }
    });
  }

  deletePlan(deletingPlan: IPlan) {
    return this.http
      .delete(`${this.url}/${deletingPlan.id}`)
      .pipe(
        tap(() =>
          this.planSubject.next(
            this.planSubject.value.filter(
              (plan) => plan.id !== deletingPlan.id,
            ),
          ),
        ),
      );
  }


  constructor(
    private http: HttpClient,
    private notifyService: NotificationService,
  ) {}
}
