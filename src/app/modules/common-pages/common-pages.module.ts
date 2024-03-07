import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnonimPageComponent } from './anonim/anonim.component';
import { AboutComponent } from './about/about.component';
import { UpdatesComponent } from './updates/updates/updates.component';
import { AddUpdateComponent } from './updates/add-update/add-update.component';
import { UserPolicyComponent } from './user-policy/user-policy.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';
import { CUSTOM_TIME_DIFF_GENERATOR, TimePastPipe } from 'ng-time-past-pipe';
import { ControlsModule } from '../controls/controls.module';
import { timeDiffGenerator } from '../controls/time';
import { TextFieldModule } from '@angular/cdk/text-field';
import { RouterModule } from '@angular/router';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';
import { RegBenefitsComponent } from './reg-benefits/reg-benefits.component';
import { AngularImageViewerModule } from '@hreimer/angular-image-viewer';
import { AppModule } from 'src/app/app.module';

@NgModule({
  declarations: [
    AnonimPageComponent,
    AboutComponent,
    RegBenefitsComponent,
    UpdatesComponent,
    PageNotFoundComponent,
    AddUpdateComponent,
    ImageViewerComponent,
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
  exports: [ImageViewerComponent],
})
export class CommonPagesModule {}
