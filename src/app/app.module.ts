import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { AdminGuard } from './modules/authentication/guards/admin.guard';
import { ModeratorGuard } from './modules/authentication/guards/moderator.guard';
import { ControlsModule } from './modules/controls/controls.module';
import { FooterComponent } from './components/footer/footer.component';
import { AngularSvgIconModule, SvgIconComponent } from 'angular-svg-icon';

@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ControlsModule,
    AngularSvgIconModule.forRoot(),
  ],
  providers: [AdminGuard, ModeratorGuard],
  bootstrap: [AppComponent],
  exports: [SvgIconComponent]
})
export class AppModule {}
