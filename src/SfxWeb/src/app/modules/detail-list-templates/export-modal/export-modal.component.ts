import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IExportInfo, exportInfo } from './utils';
@Component({
    selector: 'app-export-modal',
    templateUrl: './export-modal.component.html',
    styleUrls: ['./export-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExportModalComponent implements OnInit {
  data = inject<IExportInfo>(MAT_DIALOG_DATA);
  dialogRef = inject<MatDialogRef<ExportModalComponent>>(MatDialogRef);


  public text = [];
  public copyText = '';
  public selected: Record<string, boolean> = {};

  ngOnInit(): void {
    this.selected = this.data.config.columnSettings.reduce((previous, current) => { previous[current.displayName] = true; return previous; }, {});
  }

  updateCheckAll(event) {
    if (event.target.checked) {
      this.selectAll();
    } else {
      this.unselectAll();
    }
  }
  selectAll() {
    Object.keys(this.selected).forEach(key => this.selected[key] = true);
  }

  unselectAll() {
    Object.keys(this.selected).forEach(key => this.selected[key] = false);
  }

  export() {
    this.text = exportInfo(this.data, this.selected);
    this.copyText = this.text.join('\n');
  }

  public get allChecked() {
    return Object.keys(this.selected).every(val => this.selected[val]);
  }

  public get noneChecked() {
    return Object.keys(this.selected).every(val => !this.selected[val]);
}

}
