import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DataService } from './services/data.service';
import { TreeModule } from './modules/tree/tree.module';
import { SharedModule } from './shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { httpInterceptorProviders } from './http-interceptor';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DebuggingModule } from './views/debugging/debugging.module';
import { TelemetrySnackBarComponent } from './telemetry-snack-bar/telemetry-snack-bar.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppInsightsErrorHandler } from './error-handling';
import { MsalInterceptor, MsalRedirectComponent } from '@azure/msal-angular';
import { RestClientService } from './services/rest-client.service';
import { MsalConfigDynamicModule } from './modules/msal-dynamic-config/msal-dynamic-config.module';

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
    DebuggingModule,
    MsalConfigDynamicModule.forRoot()
  ],

  providers: [
    httpInterceptorProviders,
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    DataService,
    RestClientService,
    { provide: ErrorHandler, useClass: AppInsightsErrorHandler }
  ],
  bootstrap: [AppComponent, MsalRedirectComponent],
})
export class AppModule { }
