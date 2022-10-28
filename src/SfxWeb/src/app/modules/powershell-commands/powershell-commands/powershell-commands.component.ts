import { ChangeDetectionStrategy, Component,  Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgbNav, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { result } from 'cypress/types/lodash';
import { CommandSafetyLevel, PowershellCommand } from 'src/app/Models/PowershellCommand';
import { SettingsService } from 'src/app/services/settings.service';
import { ActionDialogComponent } from 'src/app/shared/component/action-dialog/action-dialog.component';
import { ModalData } from 'src/app/ViewModels/Modal';

@Component({
  selector: 'app-powershell-commands',
  templateUrl: './powershell-commands.component.html',
  styleUrls: ['./powershell-commands.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PowershellCommandsComponent implements ModalData{

  constructor(public dialog: MatDialog, settings: SettingsService) {
    this.settings = settings;
    if (!this.settings.getSessionVariable('commandsWarned')) {
      this.settings.setSessionVariable('commandsWarned', false);
    }
  }
  
  settings: SettingsService;

  title: string = 'Ok';
  modalTitle: string = 'Warning';
  modalMessage: string;

  activeId;
  safetyLevelEnum = CommandSafetyLevel;

  @Input() commands: PowershellCommand[];
  @ViewChild('nav') nav: NgbNav;

  onNavChange(e: NgbNavChangeEvent) {
    if (e.nextId != 1 && !this.settings.getSessionVariable('commandsWarned')) {
      e.preventDefault();

      if (e.nextId === 2) {
        this.modalMessage = "The commands you are about to view are potentially unsafe, and executing them can result in undesirable results. Please ensure you understand their risks."
      }
      else {
        this.modalMessage = "The commands you are about to view are potentially very dangerous to the cluster, and executing them incorrectly can lead to dire consequences."
      }
      let dialogRef = this.dialog.open(ActionDialogComponent, {
        data: this, panelClass: 'mat-dialog-container-wrapper'
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.nav.select(e.nextId);
          this.settings.setSessionVariable('commandsWarned', true);
        } 
      });
    }
  }

  getCommandsBySafety(level: CommandSafetyLevel): PowershellCommand[] {
    return this.commands.filter(c => c.safetyLevel === level);
  }
}
