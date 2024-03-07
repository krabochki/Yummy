import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { SelectComponent } from './select/select.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from './modal/modal.component';
import { PluralRuDirective } from './directives/plural-ru.directive';
import { ToogleSwitchComponent } from './toogle-switch/toogle-switch.component';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { SvgIconComponent, provideAngularSvgIcon } from 'angular-svg-icon';

import { SocialButtonComponent } from './social-button/social-button.component';
import { BannerComponent } from './banner/banner.component';
import { CountInputComponent } from './count-input/count-input.component';
import { UsualInputComponent } from './usual-input/usual-input.component';
import { AutocompleteComponent } from './autocomplete/autocomplete.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TimePastPipe } from 'ng-time-past-pipe';
import { SearchComponent } from './search/search.component';

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
    ReactiveFormsModule
  ],
  exports: [
    ButtonComponent,
    SelectComponent,
    SearchComponent,
    ModalComponent,
    ToogleSwitchComponent,
    PluralRuDirective,
    SocialButtonComponent,
    BannerComponent,
    CountInputComponent,
    UsualInputComponent,
    AutocompleteComponent,
  ],
  providers: [provideAngularSvgIcon()],
})
export class ControlsModule {}
