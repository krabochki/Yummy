import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './components/buttons/button/button.component';
import { SelectComponent } from './components/selects/select/select.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from './components/modals/modal/modal.component';
import { PluralRuDirective } from './directives/plural-ru.directive';
import { ToogleSwitchComponent } from './components/buttons/toogle-switch/toogle-switch.component';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';

import { SocialButtonComponent } from './components/buttons/social-button/social-button.component';
import { BannerComponent } from './components/banner/banner.component';
import { CountInputComponent } from './components/inputs/count-input/count-input.component';
import { UsualInputComponent } from './components/inputs/usual-input/usual-input.component';
import { AutocompleteComponent } from './components/selects/autocomplete/autocomplete.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TimePastPipe } from 'ng-time-past-pipe';
import { SearchComponent } from './components/selects/search/search.component';
import { ImageViewerComponent } from './components/modals/image-viewer/image-viewer.component';

@NgModule({
  declarations: [
    ButtonComponent,
    SelectComponent,
    ModalComponent,
    PluralRuDirective,
    ToogleSwitchComponent,
    SocialButtonComponent,
    BannerComponent,
    CountInputComponent,
    UsualInputComponent,
    ImageViewerComponent,
    SearchComponent,
    AutocompleteComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TextFieldModule,
    ShareButtonsModule,
    ReactiveFormsModule,
    ShareIconsModule,
    TimePastPipe,
    SvgIconComponent,
    ReactiveFormsModule,
  ],
  exports: [
    ButtonComponent,
    SelectComponent,
    ModalComponent,
    PluralRuDirective,
    ToogleSwitchComponent,
    SocialButtonComponent,
    BannerComponent,
    CountInputComponent,
    UsualInputComponent,
    ImageViewerComponent,
    SearchComponent,
    AutocompleteComponent,
  ],
  providers: [provideAngularSvgIcon()],
})
export class ControlsModule {}
