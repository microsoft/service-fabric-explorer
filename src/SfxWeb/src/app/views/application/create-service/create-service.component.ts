import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
import { ServiceType, CreateServiceDescription } from 'src/app/Models/DataModels/Service';
import { Application } from 'src/app/Models/DataModels/Application';

@Component({
  selector: 'app-create-service',
  templateUrl: './create-service.component.html',
  styleUrls: ['./create-service.component.scss']
})
export class CreateServiceComponent implements OnInit {

  description: CreateServiceDescription;
  serviceType: ServiceType;
  constructor(public dialogRef: MatDialogRef<CreateServiceComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private dataService: DataService) { }

  ngOnInit() {
    this.serviceType = this.data.data;
    this.description = new CreateServiceDescription(this.serviceType, this.serviceType.parent as Application);
  }

  create() {
    this.serviceType.createService(this.description).subscribe(() => {
      if (this.description) {
        // when success, reset the dialog
        this.description.reset();
        this.dialogRef.close();
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
