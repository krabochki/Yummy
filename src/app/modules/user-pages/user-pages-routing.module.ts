import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPagesComponent } from './user-pages.component';

const routes: Routes = [{ path: '', component: UserPagesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserPagesRoutingModule { }
