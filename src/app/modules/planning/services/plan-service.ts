import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IPlan, nullPlan } from '../models/plan';
import { HttpClient } from '@angular/common/http';
import { IUser } from '../../user-pages/models/users';
import { IRecipe } from '../../recipes/models/recipes';
import { NotificationService } from '../../user-pages/services/notification.service';
import { UserService } from '../../user-pages/services/user.service';
import { supabase } from '../../controls/image/supabase-data';

@Injectable({
  providedIn: 'root',
})
export class PlanService {

  planSubject = new BehaviorSubject<IPlan[]>([]);
  plans$ = this.planSubject.asObservable();

  loadPlanData() {
    return this.loadPlansFromSupabase();
  }

  getPlanByUser(id: number, plans: IPlan[]) {
    const find = plans.find((p) => p.user === id);
    return find ? find : nullPlan;
  }

  async updatePlan(plan: IPlan) {
    await this.updatePlanInSupabase(plan);
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
          this.updatePlan(plan);

          let showAuthor = true;
          if (author)
            showAuthor = this.userService.getPermission('hide-author', author);

          const notify = this.notifyService.buildNotification(
            'Связанный рецепт удален',
            user.id !== author?.id
              ? `Обратите внимание: рецепт «${deletingRecipe.name}»  ${
                  showAuthor
                    ? 'автора ' +
                      (author?.fullName
                        ? author.fullName
                        : '@' + author?.username)
                    : ''
                } был удален. Все ссылки на этот рецепт удалены из календаря рецептов и списка покупок. Сами запланированные рецепты и продукты в списке покупок не удалены`
              : `Обратите внимание: ваш рецепт «${deletingRecipe.name}» был удален. Все ссылки на этот рецепт удалены из ваших календаря рецептов и списка покупок. Сами запланированные рецепты и продукты в списке покупок не удалены`,
            'warning',
            'recipe',
            '',
          );

          this.notifyService.sendNotification(notify, user);
        }
      }
    });
  }

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private notifyService: NotificationService,
  ) {}

  getMaxPlanId() {
    return supabase
      .from('plans')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .then((response) => {
        if (response.data && response.data.length > 0) {
          return response.data[0].id;
        } else {
          return 0;
        }
      });
  }

  loadPlansFromSupabase() {
    return supabase
      .from('plans')
      .select('*')
      .then((response) => {
        const sPlans = response.data;
        const plans = sPlans?.map((sPlan) => {
          return this.translatePlan(sPlan);
        });
        if (plans) this.planSubject.next(plans);
      });
  }

  private translatePlan(plan: any): IPlan {
    return {
      id: plan.id,
      calendarEvents: plan.calendarevents,
      shoppingList: plan.shoppinglist,
      user: plan.user,
    } as IPlan;
  }
  addPlanToSupabase(plan: IPlan) {
    return supabase.from('plans').upsert([
      {
        id: plan.id,
        calendarevents: plan.calendarEvents,
        shoppinglist: plan.shoppingList,
        user: plan.user,
      },
    ]);
  }
  deletePlanFromSupabase(id: number) {
    return supabase.from('plans').delete().eq('id', id);
  }
  async updatePlanInSupabase(plan: IPlan) {
    const { id, ...updateData } = plan;
    await supabase
      .from('plans')
      .update({
        id: plan.id,
        calendarevents: plan.calendarEvents,
        shoppinglist: plan.shoppingList,
        user: plan.user,
      })
      .eq('id', id);
  }

  updatePlansAfterUPSERT(payload: any) {
    const currentPlans = this.planSubject.value;
    const index = currentPlans.findIndex(
      (r) => r.id === this.translatePlan(payload).id,
    );
    if (index !== -1) {
      const updatedPlans = [...currentPlans];
      updatedPlans[index] = this.translatePlan(payload);

      this.planSubject.next(updatedPlans);
    }
  }

  updatePlansAfterINSERT(payload: any) {
    const currentPlans = this.planSubject.value;
    const updatedPlans = [...currentPlans, this.translatePlan(payload)];
    this.planSubject.next(updatedPlans);
  }
  updatePlansAfterDELETE(payload: any) {
    this.planSubject.next(
      this.planSubject.value.filter(
        (plans) => plans.id !== this.translatePlan(payload).id,
      ),
    );
  }
}
