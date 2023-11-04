import { LOCALE_ID, NgModule } from '@angular/core';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';

import { PlanningRoutingModule } from './planning-routing.module';
import { PlanningComponent } from './planning.component';
import { CollectionComponent } from './collection/collection.component';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { CdkDropList, CdkDragHandle, CdkDrag } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ControlsModule } from '../controls/controls.module';
import { CalendarComponent } from './calendar/calendar.component';
import { NgbModalModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppModule } from 'src/app/app.module';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { FlatpickrModule } from 'angularx-flatpickr';
import { Russian } from 'flatpickr/dist/l10n/ru.js';
import Flatpickr from 'flatpickr';
import { TimePastPipe } from 'ng-time-past-pipe';
import { AddCalendarEventComponent } from './add-calendar-event/add-calendar-event.component';

Flatpickr.localize(Russian);
@NgModule({
  declarations: [
    PlanningComponent,
    CollectionComponent,
    ShoppingListComponent,
    CalendarComponent,
    AddCalendarEventComponent,
  ],
  imports: [
    CommonModule,
    PlanningRoutingModule,
    SvgIconComponent,
  TimePastPipe,
    ControlsModule,
    ReactiveFormsModule,
    AsyncPipe,
    CdkDropList,
    CdkDragHandle,
    CdkDropList,
    CdkDrag,
    FormsModule,
    CdkDragHandle,
    NgFor,
    CdkDrag,
    NgbModalModule,
    FlatpickrModule.forRoot(
    ),

    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    NgbModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'ru' }, provideAngularSvgIcon()],
})
export class PlanningModule {}
