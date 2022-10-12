import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DataService } from './services/data.service';
import { TreeModule } from './modules/tree/tree.module';
import { SharedModule } from './shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { initApp } from './app-initializers';
import { AdalService } from './services/adal.service';
import { httpInterceptorProviders } from './http-interceptor';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DebuggingModule } from './views/debugging/debugging.module';
import { TelemetrySnackBarComponent } from './telemetry-snack-bar/telemetry-snack-bar.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppInsightsErrorHandler } from './error-handling';
import { StandaloneIntegrationService } from './services/standalone-integration.service';

@NgModule({
  declarations: [
    AppComponent,
    TelemetrySnackBarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    TreeModule,
    SharedModule,
    NoopAnimationsModule,
    MatDialogModule,
    NgbDropdownModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    MatSnackBarModule,
    DebuggingModule
  ],

  providers: [
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    AdalService,
    DataService,
    StandaloneIntegrationService,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      multi: true,
      deps: [AdalService, StandaloneIntegrationService]
    },
    httpInterceptorProviders,
    { provide: ErrorHandler, useClass: AppInsightsErrorHandler }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
