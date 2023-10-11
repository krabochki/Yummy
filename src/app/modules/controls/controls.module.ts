import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { SelectComponent } from './select/select.component';
import { RouterModule } from '@angular/router';
import { InputComponent } from './input/input.component';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from './modal/modal.component';
@NgModule({
  declarations: [ButtonComponent, SelectComponent, InputComponent, ModalComponent],
  imports: [
    CommonModule, RouterModule,FormsModule
  ],
  exports:[
    ButtonComponent,
    SelectComponent,
    InputComponent
  ]
})
export class ControlsModule { }
