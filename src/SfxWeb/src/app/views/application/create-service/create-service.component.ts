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

  constructor(public dialogRef: MatDialogRef<CreateServiceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceType,
    private dataService: DataService) { }

  ngOnInit() {
    this.description = new CreateServiceDescription(this.data, <Application>this.data.parent);
  }

  create() {
    this.data.createService(this.description).subscribe(() => {
      if(this.description) {
        //when success, reset the dialog
        this.description.reset();
      }
    })
  }

}
