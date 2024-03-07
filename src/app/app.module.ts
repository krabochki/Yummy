import { APP_INITIALIZER, NgModule } from '@angular/core';
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
import { UserService } from './modules/user-pages/services/user.service';
import { RecipesModule } from './modules/recipes/recipes.module';
import { UserPagesModule } from './modules/user-pages/user-pages.module';
import { AuthService } from './modules/authentication/services/auth.service';
import { CommonPagesModule } from './modules/common-pages/common-pages.module';
import { AngularImageViewerModule } from '@hreimer/angular-image-viewer';

@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RecipesModule,
    ControlsModule,
    BrowserModule,
    AngularImageViewerModule,
    UserPagesModule,
    CommonPagesModule,
    AngularSvgIconModule.forRoot(),
  ],
  providers: [
    AdminGuard,
    ModeratorGuard,
    
  ],
  bootstrap: [AppComponent],
  exports: [SvgIconComponent],
})
export class AppModule {}
