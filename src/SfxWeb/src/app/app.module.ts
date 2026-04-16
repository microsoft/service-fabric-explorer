import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
import { ActionDialogModule } from './modules/action-dialog/action-dialog.module';

@NgModule({ declarations: [
        AppComponent,
        TelemetrySnackBarComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        TreeModule,
        SharedModule,
        NoopAnimationsModule,
        MatDialogModule,
        NgbDropdownModule,
        ReactiveFormsModule,
        NgbTooltipModule,
        MatSnackBarModule,
        DebuggingModule,
        ActionDialogModule], providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        AdalService,
        DataService,
        StandaloneIntegrationService,
        provideAppInitializer(() => {
        const initializerFn = (initApp)(inject(AdalService), inject(StandaloneIntegrationService));
        return initializerFn();
      }),
        httpInterceptorProviders,
        { provide: ErrorHandler, useClass: AppInsightsErrorHandler },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
