import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DataService } from './services/data.service';
import { TreeModule } from './modules/tree/tree.module';
import { SharedModule } from './shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { BackupRestoreModule } from './modules/backup-restore/backup-restore.module';
import { ActionCreateBackupPolicyComponent } from './views/cluster/action-create-backup-policy/action-create-backup-policy.component';
import { ClusterModule } from './views/cluster/cluster.module';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { initApp } from './app-initializers';
import { AdalService } from './services/adal.service';
import { httpInterceptorProviders } from './http-interceptor';
import { CreateServiceComponent } from './views/application/create-service/create-service.component';
import { ApplicationModule } from './views/application/application.module';
import { ServiceModule } from './views/service/service.module';
import { PartitionModule } from './views/partition/partition.module';
import { PartitionRestoreBackUpComponent } from './views/partition/partition-restore-back-up/partition-restore-back-up.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    TreeModule,
    SharedModule,
    NoopAnimationsModule,
    MatDialogModule,
    BackupRestoreModule,
    NgbDropdownModule,
    ApplicationModule,
    //test
    ClusterModule,
    ServiceModule,
    PartitionModule
  ],
  
  providers: [
    AdalService,
    DataService,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      multi: true,
      deps: [AdalService]
    },
    httpInterceptorProviders
  ],
  entryComponents: [ActionCreateBackupPolicyComponent, CreateServiceComponent, PartitionRestoreBackUpComponent],
  bootstrap: [AppComponent],
})
export class AppModule { } 
