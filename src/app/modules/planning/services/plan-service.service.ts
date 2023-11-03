import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { IPlan, nullPlan } from '../models/plan';
import { HttpClient } from '@angular/common/http';
import { plansUrl } from 'src/tools/source';
import { ICategory } from '../../recipes/models/categories';

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

  constructor(private http: HttpClient) {}
}
