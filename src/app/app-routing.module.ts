import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ModeratorGuard } from './guards/moderator.guard';
import { ModeratorPageComponent } from './components/moderator-page/moderator-page.component';

const routes: Routes = [
  { path: '', component: MainPageComponent },
  { path: 'admin-panel', canActivate: [AdminGuard],component: ModeratorPageComponent },
  { path: 'moderator-panel', canActivate: [ModeratorGuard],component: ModeratorPageComponent },
  { path: 'your-recipes',  canActivate: [AuthGuard],component: MainPageComponent },
  { path: 'favourite-recipes', component: MainPageComponent },
  { path: 'all-recipes', component: MainPageComponent },
  { path: '**', component: MainPageComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
