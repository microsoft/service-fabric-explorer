import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-bug-report-dialog',
  templateUrl: './bug-report-dialog.component.html',
  styleUrls: ['./bug-report-dialog.component.scss']
})
export class BugReportDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<BugReportDialogComponent>) { }

  ngOnInit(): void {
  }

  cancel() {
    this.dialogRef.close();
  }
}
