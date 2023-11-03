import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';

import { PlanningRoutingModule } from './planning-routing.module';
import { PlanningComponent } from './planning.component';
import { CollectionComponent } from './collection/collection.component';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { CdkDropList, CdkDragHandle, CdkDrag } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule } from '@angular/forms';
import { ControlsModule } from '../controls/controls.module';

@NgModule({
  declarations: [PlanningComponent, CollectionComponent, ShoppingListComponent],
  imports: [
    CommonModule,
    PlanningRoutingModule,
    SvgIconComponent,
    ControlsModule,
    ReactiveFormsModule,
    AsyncPipe,
    CdkDropList,
    CdkDragHandle,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    NgFor,
    CdkDrag,
  ],
  providers: [provideAngularSvgIcon()],
})
export class PlanningModule {}
