import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DataService } from './services/data.service';
import { TreeModule } from './modules/tree/tree.module';
import { SharedModule } from './shared/shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { initApp } from './app-initializers';
import { MsalService } from './services/msal.service';
import { httpInterceptorProviders } from './http-interceptor';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DebuggingModule } from './views/debugging/debugging.module';
import { TelemetrySnackBarComponent } from './telemetry-snack-bar/telemetry-snack-bar.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppInsightsErrorHandler } from './error-handling';
import { StandaloneIntegrationService } from './services/standalone-integration.service';
import { ActionDialogModule } from './modules/action-dialog/action-dialog.module';

@NgModule({ declarations: [
        AppComponent,
        TelemetrySnackBarComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        TreeModule,
        SharedModule,
        MatDialogModule,
        NgbDropdownModule,
        ReactiveFormsModule,
        NgbTooltipModule,
        MatSnackBarModule,
        DebuggingModule,
        ActionDialogModule], providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        MsalService,
        DataService,
        StandaloneIntegrationService,
        provideAppInitializer(() => {
        const initializerFn = (initApp)(inject(MsalService), inject(StandaloneIntegrationService));
        return initializerFn();
      }),
        httpInterceptorProviders,
        { provide: ErrorHandler, useClass: AppInsightsErrorHandler },
        provideHttpClient(withXhr(), withInterceptorsFromDi())
    ] })
export class AppModule { }
