import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanningComponent } from './planning.component';
import { CollectionComponent } from './collection/collection.component';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { CalendarComponent } from './calendar/calendar.component';
import { CalendarDateFormatter } from 'angular-calendar';
import { CustomDateFormatter } from './custom-date-formatter';

const routes: Routes = [
  {
    path: '',
    component: PlanningComponent,
    children: [
      {
        path: 'plan/collections',
        component: CollectionComponent,
      },
      {
        path: 'plan/calendar',
        component: CalendarComponent,
        canActivate:[AuthGuard]
      },
      {
        path: 'plan/shopping-list',
        component: ShoppingListComponent,
        canActivate: [AuthGuard]
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],

})
export class PlanningRoutingModule {}
