import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IExportInfo, exportInfo } from './utils';
@Component({
  selector: 'app-export-modal',
  templateUrl: './export-modal.component.html',
  styleUrls: ['./export-modal.component.scss']
})
export class ExportModalComponent implements OnInit {

  public text = [];

  public selected: Record<string, boolean> = {};
  constructor(@Inject(MAT_DIALOG_DATA) public data: IExportInfo,
              public dialogRef: MatDialogRef<ExportModalComponent>) { }

  ngOnInit(): void {
    this.selected = this.data.config.columnSettings.reduce( (previous, current) => {previous[current.displayName] = true; return previous}, {});
  }

  export() {
    this.text = exportInfo(this.data, this.selected);
  }
}