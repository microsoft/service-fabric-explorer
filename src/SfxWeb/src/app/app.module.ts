import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
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

    //test
    ClusterModule
  ],
  providers: [DataService],
  entryComponents: [ActionCreateBackupPolicyComponent],
  bootstrap: [AppComponent],
})
export class AppModule { } 
