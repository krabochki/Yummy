import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from './components/about/about.component';
import { UpdatesComponent } from './components/updates/updates/updates.component';
import { AddUpdateComponent } from './components/updates/add-update/add-update.component';
import { UserPolicyComponent } from './components/user-policy/user-policy.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { CUSTOM_TIME_DIFF_GENERATOR, TimePastPipe } from 'ng-time-past-pipe';
import { ControlsModule } from '../controls/controls.module';
import { timeDiffGenerator } from '../controls/services/time';
import { TextFieldModule } from '@angular/cdk/text-field';
import { RouterModule } from '@angular/router';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { RegBenefitsComponent } from './components/reg-benefits/reg-benefits.component';

@NgModule({
  declarations: [
    AboutComponent,
    RegBenefitsComponent,
    UpdatesComponent,
    AddUpdateComponent,
    PageNotFoundComponent,
    UserPolicyComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TimePastPipe,
    RouterModule,
    ControlsModule,
    TextFieldModule,
    ShareButtonsModule,
    ShareIconsModule,
    SvgIconComponent,
  ],
  providers: [
    { provide: CUSTOM_TIME_DIFF_GENERATOR, useValue: timeDiffGenerator },
    provideAngularSvgIcon(),
  ],
})
export class CommonPagesModule {}
